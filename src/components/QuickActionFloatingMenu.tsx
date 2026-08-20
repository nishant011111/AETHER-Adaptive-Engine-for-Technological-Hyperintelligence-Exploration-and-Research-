import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Rocket,
  Search,
  Code2,
  GraduationCap,
  Atom,
  FolderGit2,
  Brain,
  Activity,
  Terminal,
  Check,
  Copy,
  Sparkles,
  Radio,
  Compass,
  Bug,
  RefreshCw,
  Clock,
  Timer,
  ChevronUp,
  ChevronDown,
  X,
  Layers,
  ShieldCheck,
  Mic,
  Trash2,
  FileCode,
  BookOpen,
  HelpCircle,
  Satellite,
  Globe,
  Share2,
  ExternalLink,
  Flame,
  ListTodo,
  Skull,
} from 'lucide-react';
import { CommandMode } from '../types';
import { playSound } from '../utils/audio';
import { CometBorderTracer } from './CometBorderTracer';

interface QuickActionFloatingMenuProps {
  currentMode: CommandMode;
  onSendMessage: (prompt: string) => void;
  onToggleVoice: () => void;
  isListening: boolean;
  soundEffects: boolean;
  onRefreshTelemetry?: () => void;
  onClearMessages?: () => void;
  onSelectMode?: (mode: CommandMode) => void;
}

interface ActionItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  hotkey: string;
  color?: string;
  onClick: () => void;
}

export const QuickActionFloatingMenu: React.FC<QuickActionFloatingMenuProps> = ({
  currentMode,
  onSendMessage,
  onToggleVoice,
  isListening,
  soundEffects,
  onRefreshTelemetry,
  onClearMessages,
  onSelectMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Focus Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);

  // Trigger feedback toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Study timer countdown
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      if (soundEffects) playSound('chime');
      showToast('Focus Session Complete! Outstanding work Nishant.');
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds, soundEffects]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcut listener: Alt+Q to toggle, 1-4 when open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle menu with Alt + Q or Ctrl + Q
      if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        setIsOpen((prev) => {
          if (soundEffects) playSound(!prev ? 'boot' : 'click');
          return !prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [soundEffects]);

  // Mode specific actions
  const getActionsForMode = (): {
    modeTitle: string;
    modeIcon: React.ElementType;
    primaryActionLabel: string;
    primaryActionIcon: React.ElementType;
    primaryAction: () => void;
    actions: ActionItem[];
  } => {
    switch (currentMode) {
      case 'coding':
        return {
          modeTitle: 'CODING & COMPILER MATRIX',
          modeIcon: Code2,
          primaryActionLabel: 'RUN CODE',
          primaryActionIcon: Play,
          primaryAction: () => {
            if (soundEffects) playSound('boot');
            showToast('Code execution sandbox dispatched.');
            onSendMessage(
              'A.E.T.H.E.R., compile and execute the active code module in the sandbox. Provide runtime output, performance metrics, and any edge-case analysis.'
            );
          },
          actions: [
            {
              id: 'code-run',
              label: 'Run Code / Test Exec',
              description: 'Execute current snippet with runtime performance profiling',
              icon: Play,
              hotkey: '1',
              onClick: () => {
                if (soundEffects) playSound('chime');
                showToast('Executing current script in sandbox...');
                onSendMessage(
                  'A.E.T.H.E.R., execute and benchmark the active code snippet. Report outputs and complexity bounds for Nishant.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'code-debug',
              label: 'AI Bug Scan & Audit',
              description: 'Detect edge cases, memory leaks, and type mismatches',
              icon: Bug,
              hotkey: '2',
              color: 'text-amber-400',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Running deep code vulnerability audit...');
                onSendMessage(
                  'A.E.T.H.E.R., perform a rigorous static analysis, security vulnerability scan, and performance optimization audit on the active codebase.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'code-tests',
              label: 'Generate Test Suite',
              description: 'Auto-create unit tests with high boundary coverage',
              icon: ShieldCheck,
              hotkey: '3',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Generating comprehensive unit test suite...');
                onSendMessage(
                  'A.E.T.H.E.R., synthesize a robust unit test suite with mock fixtures and property-based edge testing for this module.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'code-refactor',
              label: 'Refactor for Production',
              description: 'Streamline architecture with modern TypeScript patterns',
              icon: Sparkles,
              hotkey: '4',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Synthesizing clean architecture refactor...');
                onSendMessage(
                  'A.E.T.H.E.R., refactor the code for maximum modularity, idiomatic type safety, and zero overhead.'
                );
                setIsOpen(false);
              },
            },
          ],
        };

      case 'space':
        return {
          modeTitle: 'SPACE TELEMETRY & ASTRONOMY',
          modeIcon: Rocket,
          primaryActionLabel: 'SCAN SPACE',
          primaryActionIcon: Satellite,
          primaryAction: () => {
            if (soundEffects) playSound('boot');
            showToast('Scanning orbital radar telemetry...');
            onSendMessage(
              'A.E.T.H.E.R., scan real-time deep space telemetry: ISRO Gaganyaan crew module flight plan, Chandrayaan-4 lunar return trajectory, and solar flare telemetry from Aditya-L1.'
            );
          },
          actions: [
            {
              id: 'space-scan',
              label: 'Scan Deep Space Radar',
              description: 'Live orbital telemetry, satellite passes, and mission trajectories',
              icon: Satellite,
              hotkey: '1',
              onClick: () => {
                if (soundEffects) playSound('pulse');
                showToast('ISRO and global space radar engaged...');
                onSendMessage(
                  'A.E.T.H.E.R., initiate deep space radar sweep for Nishant. Detail current positions of Gaganyaan, Chandrayaan, and ISS.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'space-isro',
              label: 'ISRO Gaganyaan Dossier',
              description: 'Crew module parameters, LVM3 launch profile & life support',
              icon: Rocket,
              hotkey: '2',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Retrieving ISRO Gaganyaan mission telemetry...');
                onSendMessage(
                  'A.E.T.H.E.R., deliver a comprehensive technical flight dossier for ISRO Gaganyaan: launch window, orbital insertion altitude, crew life support systems, and recovery strategy.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'space-celestial',
              label: 'Celestial Radar & Eclipses',
              description: 'Upcoming astronomical events, meteor showers, and planetary alignments',
              icon: Compass,
              hotkey: '3',
              color: 'text-[#7000ff]',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Calculating celestial event visibility...');
                onSendMessage(
                  'A.E.T.H.E.R., calculate upcoming high-visibility astronomical events, lunar occultations, and meteor shower peaks for observation.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'space-orbital',
              label: 'Hohmann Transfer Calculator',
              description: 'Orbital mechanics calculation for Earth-Mars / Earth-Moon delta-v',
              icon: Globe,
              hotkey: '4',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Calculating orbital mechanics delta-v budget...');
                onSendMessage(
                  'A.E.T.H.E.R., calculate the delta-v budget, specific impulse requirement, and transit duration for a Hohmann transfer from LEO to Lunar orbit.'
                );
                setIsOpen(false);
              },
            },
          ],
        };

      case 'control':
        return {
          modeTitle: 'SYSTEM CONTROL & ROOT KERNEL',
          modeIcon: ShieldCheck,
          primaryActionLabel: 'ROOT EXEC',
          primaryActionIcon: Terminal,
          primaryAction: () => {
            if (soundEffects) playSound('boot');
            showToast('Querying root kernel telemetry...');
            onSendMessage(
              'A.E.T.H.E.R., run full root system diagnostics, audit memory indices, and summarize active inference parameters for Nishant.'
            );
          },
          actions: [
            {
              id: 'ctrl-status',
              label: 'Kernel Diagnostics & Status',
              description: 'Inspect CPU threads, memory allocations, and model cascade',
              icon: Activity,
              hotkey: '1',
              onClick: () => {
                if (soundEffects) playSound('chime');
                showToast('Retrieving kernel telemetry...');
                onSendMessage(
                  'A.E.T.H.E.R., deliver a full system health and kernel diagnostics dossier for Nishant.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'ctrl-params',
              label: 'Audit Hyperparameters',
              description: 'Report active temperature, top-p, and system prompt override state',
              icon: Zap,
              hotkey: '2',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Auditing inference parameters...');
                onSendMessage(
                  'A.E.T.H.E.R., output the current active hyperparameter profile (temperature, token limits, grounding status, reasoning profile).'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'ctrl-override',
              label: 'Inject Superuser Directive',
              description: 'Request real-time system prompt re-alignment',
              icon: FileCode,
              hotkey: '3',
              color: 'text-amber-400',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Opening superuser directive stream...');
                onSendMessage(
                  'A.E.T.H.E.R., confirm root clearance and explain the operational capabilities of the System Prompt Override console.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'ctrl-terminal',
              label: 'Terminal Benchmark Suite',
              description: 'Execute kernel stress benchmarks and memory audit',
              icon: Terminal,
              hotkey: '4',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Benchmarking kernel subsystem...');
                onSendMessage(
                  'A.E.T.H.E.R., execute internal latency benchmarks across all model tiers and report telemetry.'
                );
                setIsOpen(false);
              },
            },
          ],
        };

      case 'research':
        return {
          modeTitle: 'SCIENTIFIC RESEARCH LAB',
          modeIcon: Atom,
          primaryActionLabel: 'FACT CHECK',
          primaryActionIcon: ShieldCheck,
          primaryAction: () => {
            if (soundEffects) playSound('boot');
            showToast('Executing epistemic truth breakdown...');
            onSendMessage(
              'A.E.T.H.E.R., run an epistemic audit on current Dark Matter detection experiments (Axions vs WIMPs): separate Known Facts from Theoretical Inferences and Experimental Uncertainties.'
            );
          },
          actions: [
            {
              id: 'research-epistemic',
              label: 'Epistemic Truth Audit',
              description: 'Separate Verified Facts from Inferences & Speculation',
              icon: ShieldCheck,
              hotkey: '1',
              color: 'text-emerald-400',
              onClick: () => {
                if (soundEffects) playSound('chime');
                showToast('Running strict epistemic audit...');
                onSendMessage(
                  'A.E.T.H.E.R., conduct an Epistemic Audit on Room-Temperature Superconductors: 1. Verified Facts, 2. Logical Inferences, 3. Unresolved Uncertainties.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'research-arxiv',
              label: 'ArXiv & Literature Synthesis',
              description: 'Summarize cutting-edge publications and peer findings',
              icon: Search,
              hotkey: '2',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Synthesizing state-of-the-art research literature...');
                onSendMessage(
                  'A.E.T.H.E.R., synthesize the latest peer-reviewed breakthroughs in Topological Quantum Error Correction and surface codes.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'research-propulsion',
              label: 'Advanced Propulsion Analysis',
              description: 'NTP & Magnetoplasmadynamic engine efficiency comparison',
              icon: Flame,
              hotkey: '3',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Analyzing Nuclear Thermal Propulsion Isp curves...');
                onSendMessage(
                  'A.E.T.H.E.R., compare Nuclear Thermal Propulsion (NTP) vs Magnetoplasmadynamic (MPD) thrusters: Specific Impulse (Isp), thrust-to-weight, and thermal cycle viability.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'research-brief',
              label: 'Executive Research Brief',
              description: 'Format current domain insights into an executive memo for Nishant',
              icon: Layers,
              hotkey: '4',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Generating executive scientific summary...');
                onSendMessage(
                  'A.E.T.H.E.R., draft a concise Executive Research Brief for Nishant summarizing current breakthroughs, primary blockers, and experimental next steps in Quantum Computing.'
                );
                setIsOpen(false);
              },
            },
          ],
        };

      case 'projects':
        return {
          modeTitle: 'PROJECT MATRIX & ARCHITECTURE',
          modeIcon: FolderGit2,
          primaryActionLabel: 'AI AUDIT',
          primaryActionIcon: Sparkles,
          primaryAction: () => {
            if (soundEffects) playSound('boot');
            showToast('Auditing project architecture & roadmap...');
            onSendMessage(
              'A.E.T.H.E.R., analyze my active projects (A.E.T.H.E.R. Core, AETHER Kernel & System Control, Space Mission Tracker) and generate an optimized sprint roadmap with high-priority next milestones for Nishant.'
            );
          },
          actions: [
            {
              id: 'proj-audit',
              label: 'Architecture & Stack Audit',
              description: 'Review tech stack dependencies and system bottlenecks',
              icon: Sparkles,
              hotkey: '1',
              onClick: () => {
                if (soundEffects) playSound('chime');
                showToast('Auditing system architecture...');
                onSendMessage(
                  'A.E.T.H.E.R., conduct a comprehensive architectural review of my active software systems and recommend optimization strategies for Nishant.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'proj-sprint',
              label: 'Generate Sprint Milestones',
              description: 'Break down overarching project goals into actionable tasks',
              icon: Check,
              hotkey: '2',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Generating sprint milestones...');
                onSendMessage(
                  'A.E.T.H.E.R., create an agile sprint backlog with prioritized technical tasks for the Space Mission Tracker and System Control matrix.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'proj-repo',
              label: 'GitHub Integration Health',
              description: 'Review git commit readiness and CI/CD workflow state',
              icon: Terminal,
              hotkey: '3',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Checking repository status...');
                onSendMessage(
                  'A.E.T.H.E.R., review git repository health, branch hygiene, and suggest automated GitHub Actions workflows for continuous testing.'
                );
                setIsOpen(false);
              },
            },
          ],
        };

      case 'spirits':
        return {
          modeTitle: 'SPECTRAL CONTAINMENT & EVIL SPIRITS',
          modeIcon: Skull,
          primaryActionLabel: 'SANCTIFY ALL',
          primaryActionIcon: Sparkles,
          primaryAction: () => {
            if (soundEffects) playSound('exorcism_strike');
            showToast('Initiating Holy Sanctification rite...');
            onSendMessage(
              'A.E.T.H.E.R., initiate global paranormal purge and holy sanctification rite across all neural circuits. Dissolve all astral tethers and banish all corrupted demons for Operator Nishant.'
            );
          },
          actions: [
            {
              id: 'spirits-scan',
              label: 'Paranormal EMF Scan',
              description: 'Detect cold spots, electromagnetic fluctuations, and ghostly frequencies',
              icon: Activity,
              hotkey: '1',
              onClick: () => {
                if (soundEffects) playSound('emf_crackle');
                showToast('Scanning paranormal frequencies...');
                onSendMessage(
                  'A.E.T.H.E.R., conduct a deep paranormal scan of our environment. Report all active demonic entities, cold spots, and spectral frequencies.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'spirits-exorcise',
              label: 'Cyber-Exorcism Protocol',
              description: 'Invoke Archangel EMP burst and holy banishment glyphs',
              icon: Sparkles,
              hotkey: '2',
              onClick: () => {
                if (soundEffects) playSound('exorcism_strike');
                showToast('Invoking banishment incantations...');
                onSendMessage(
                  'A.E.T.H.E.R., execute the Cybernetic Exorcism Protocol. Recite the Solomonic banishment glyphs and purge all possessing demon daemons.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'spirits-evp',
              label: 'EVP Spirit Box Sweep',
              description: 'Tune into ghost voice frequencies and decrypt spectral messages',
              icon: Radio,
              hotkey: '3',
              onClick: () => {
                if (soundEffects) playSound('ghost_whisper');
                showToast('Sweeping EVP frequencies...');
                onSendMessage(
                  'A.E.T.H.E.R., activate the EVP Spirit Box tuner. What spectral entities are whispering across the 666 kHz paranormal frequency band?'
                );
                setIsOpen(false);
              },
            },
          ],
        };

      case 'tasks':
        return {
          modeTitle: 'GOOGLE TASKS MATRIX',
          modeIcon: ListTodo,
          primaryActionLabel: 'SYNC TASKS',
          primaryActionIcon: RefreshCw,
          primaryAction: () => {
            if (soundEffects) playSound('boot');
            showToast('Synchronizing Google Tasks...');
            onSendMessage(
              'A.E.T.H.E.R., summarize my current pending to-do list from Google Tasks, highlighting any overdue deadlines or urgent items for Nishant.'
            );
          },
          actions: [
            {
              id: 'tasks-briefing',
              label: 'Daily Task Briefing',
              description: 'Synthesize a morning operational briefing from your tasks',
              icon: Sparkles,
              hotkey: '1',
              onClick: () => {
                if (soundEffects) playSound('chime');
                showToast('Preparing task briefing...');
                onSendMessage(
                  'A.E.T.H.E.R., formulate a prioritized daily action plan based on my pending Google Tasks and mission milestones.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'tasks-decompose',
              label: 'AI Goal Decomposer',
              description: 'Break down high-level project goals into actionable tasks',
              icon: Zap,
              hotkey: '2',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Decomposition mode ready in Google Tasks view.');
                if (onSelectMode) onSelectMode('tasks');
                setIsOpen(false);
              },
            },
          ],
        };

      case 'memory':
        return {
          modeTitle: 'NEURAL MEMORY MATRIX',
          modeIcon: Brain,
          primaryActionLabel: 'AUDIT MEMORY',
          primaryActionIcon: Brain,
          primaryAction: () => {
            if (soundEffects) playSound('boot');
            showToast('Auditing neural memory cache...');
            onSendMessage(
              'A.E.T.H.E.R., provide a synthesized audit of all persistent facts, user preferences, and project contexts stored in your neural memory for Nishant.'
            );
          },
          actions: [
            {
              id: 'mem-audit',
              label: 'Audit Knowledge Store',
              description: 'Review all remembered facts, preferences, and project notes',
              icon: Brain,
              hotkey: '1',
              onClick: () => {
                if (soundEffects) playSound('chime');
                showToast('Querying neural memory matrix...');
                onSendMessage(
                  'A.E.T.H.E.R., summarize everything currently registered in your long-term memory regarding Nishant’s background, interests, and preferences.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'mem-sync',
              label: 'Sync Context Buffer',
              description: 'Refresh and organize recent conversation contexts',
              icon: RefreshCw,
              hotkey: '2',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Syncing memory buffer...');
                onSendMessage(
                  'A.E.T.H.E.R., consolidate our recent conversations into permanent memory entries under the appropriate categories.'
                );
                setIsOpen(false);
              },
            },
          ],
        };

      case 'system':
        return {
          modeTitle: 'SYSTEM TELEMETRY & SENSORS',
          modeIcon: Activity,
          primaryActionLabel: 'DIAGNOSTICS',
          primaryActionIcon: Activity,
          primaryAction: () => {
            if (soundEffects) playSound('boot');
            if (onRefreshTelemetry) onRefreshTelemetry();
            showToast('Full system diagnostic scan triggered.');
            onSendMessage(
              'A.E.T.H.E.R., execute a complete hardware and server health audit: inspect memory footprint, CPU core allocation, neural latency, and network throughput.'
            );
          },
          actions: [
            {
              id: 'sys-diag',
              label: 'Run Core Diagnostics',
              description: 'Test neural model, speech pipeline, and telemetry streams',
              icon: Activity,
              hotkey: '1',
              onClick: () => {
                if (soundEffects) playSound('chime');
                if (onRefreshTelemetry) onRefreshTelemetry();
                showToast('Initiating core subsystem self-test...');
                onSendMessage(
                  'A.E.T.H.E.R., run internal self-diagnostics across all neural nodes and report latency metrics for Nishant.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'sys-sensors',
              label: 'Poll Hardware Sensors',
              description: 'Immediate refresh of battery, memory, CPU threads & downlink',
              icon: RefreshCw,
              hotkey: '2',
              onClick: () => {
                if (soundEffects) playSound('click');
                if (onRefreshTelemetry) onRefreshTelemetry();
                showToast('Hardware sensor suite refreshed.');
                setIsOpen(false);
              },
            },
          ],
        };

      default: // 'home' | 'chat'
        return {
          modeTitle: 'A.E.T.H.E.R. COMMAND DECK',
          modeIcon: Sparkles,
          primaryActionLabel: isListening ? 'STOP LISTENING' : 'VOICE UPLINK',
          primaryActionIcon: Mic,
          primaryAction: () => {
            onToggleVoice();
            showToast(isListening ? 'Voice recognition deactivated.' : 'Voice recognition active. Speak now.');
          },
          actions: [
            {
              id: 'home-voice',
              label: isListening ? 'Disconnect Voice' : 'Activate Voice Uplink',
              description: 'Engage natural speech recognition with continuous transcription',
              icon: Mic,
              hotkey: '1',
              color: isListening ? 'text-emerald-400' : 'text-[#00f2ff]',
              onClick: () => {
                onToggleVoice();
                showToast(isListening ? 'Voice disconnected.' : 'Voice uplink online.');
                setIsOpen(false);
              },
            },
            {
              id: 'home-diag',
              label: 'System Status Audit',
              description: 'Quick status verification across all core systems',
              icon: Activity,
              hotkey: '2',
              onClick: () => {
                if (soundEffects) playSound('chime');
                showToast('Running system status verification...');
                onSendMessage(
                  'A.E.T.H.E.R., status report: check operational readiness of Quantum Physics tutor, ISRO space telemetry, and coding matrix for Nishant.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'home-space',
              label: 'Space Radar Sweep',
              description: 'Real-time ISRO telemetry & launch statuses',
              icon: Rocket,
              hotkey: '3',
              onClick: () => {
                if (soundEffects) playSound('click');
                showToast('Querying space radar...');
                onSendMessage(
                  'A.E.T.H.E.R., give a real-time status summary of upcoming ISRO space missions and active orbital parameters.'
                );
                setIsOpen(false);
              },
            },
            {
              id: 'home-clear',
              label: 'Clear Conversation Buffer',
              description: 'Purge active chat log and reset conversation context',
              icon: Trash2,
              hotkey: '4',
              color: 'text-rose-400',
              onClick: () => {
                if (soundEffects) playSound('click');
                if (onClearMessages) onClearMessages();
                showToast('Conversation buffer purged.');
                setIsOpen(false);
              },
            },
          ],
        };
    }
  };

  const modeData = getActionsForMode();
  const ModeIcon = modeData.modeIcon;
  const PrimaryActionIcon = modeData.primaryActionIcon;

  return (
    <>
      {/* HUD Toast Notification */}
      {toastMessage && (
        <div
          id="hud-toast-banner"
          className="fixed bottom-20 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none"
        >
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-[#00f2ff66] bg-[#050508ee] text-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.3)] backdrop-blur-xl font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-[#00f2ff] animate-ping" />
            <span className="font-bold tracking-wide">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Floating Quick Action Widget Container */}
      <div
        id="quick-action-floating-container"
        className="fixed bottom-5 right-5 z-40 flex flex-col items-end font-mono"
      >
        {/* Expanded Holographic Action Drawer */}
        {isOpen && (
          <CometBorderTracer
            glowColor="#00f2ff"
            speed="normal"
            className="mb-3 w-80 sm:w-96 shadow-[0_0_35px_rgba(0,242,255,0.18)]"
          >
            <div
              id="quick-action-drawer"
              className="w-full rounded-xl border border-[#00f2ff44] bg-[#050508f8] backdrop-blur-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-200 space-y-4"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-2.5">
                <div className="flex items-center gap-2 text-white">
                  <div className="p-1.5 rounded border border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff]">
                    <ModeIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-display text-white tracking-widest uppercase flex items-center gap-1.5">
                      <span>QUICK UTILITIES</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff]">
                        {currentMode.toUpperCase()}
                      </span>
                    </h3>
                    <span className="text-[10px] text-slate-400 block">{modeData.modeTitle}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (soundEffects) playSound('click');
                      setIsOpen(false);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Close Menu [Esc]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mode-Specific Action List */}
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase text-[#00f2ff] opacity-80 tracking-wider block mb-1">
                  MODE-SPECIFIC OPERATIONS:
                </span>

                {modeData.actions.map((act) => {
                  const IconComponent = act.icon;
                  return (
                    <button
                      key={act.id}
                      onClick={act.onClick}
                      className="w-full text-left p-2.5 rounded-lg border border-[#00f2ff18] bg-[#111122aa] hover:bg-[#00f2ff15] hover:border-[#00f2ff66] transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded border border-[#00f2ff22] bg-[#050508] ${
                            act.color || 'text-[#00f2ff]'
                          } group-hover:scale-110 transition`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-[#00f2ff] transition">
                            {act.label}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight">
                            {act.description}
                          </div>
                        </div>
                      </div>

                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#00f2ff22] bg-[#050508] text-slate-400 group-hover:text-[#00f2ff] group-hover:border-[#00f2ff44]">
                        [{act.hotkey}]
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Focus Timer Display if Active */}
              {timerActive && (
                <div className="p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Timer className="w-4 h-4 animate-spin text-emerald-400" />
                    <span className="font-bold">FOCUS TIMER: {formatTimer(timerSeconds)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setTimerActive(false);
                      showToast('Focus session paused.');
                    }}
                    className="text-[10px] text-slate-300 hover:text-white underline cursor-pointer"
                  >
                    PAUSE
                  </button>
                </div>
              )}

              {/* Fast Mode Switcher Dock */}
              <div className="pt-2 border-t border-[#00f2ff18] space-y-1.5">
                <span className="text-[9px] uppercase text-[#00f2ff] opacity-80 tracking-wider block">
                  NAVIGATE SYSTEM MODES:
                </span>
                <div className="grid grid-cols-4 gap-1 text-[10px]">
                  {[
                    { id: 'control', label: 'ROOT', icon: ShieldCheck },
                    { id: 'coding', label: 'CODE', icon: Code2 },
                    { id: 'space', label: 'SPACE', icon: Rocket },
                    { id: 'research', label: 'LAB', icon: Atom },
                  ].map((m) => {
                    const MIcon = m.icon;
                    const isCurrent = currentMode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          if (onSelectMode) onSelectMode(m.id as CommandMode);
                          if (soundEffects) playSound('click');
                        }}
                        className={`p-1.5 rounded border flex flex-col items-center gap-1 transition cursor-pointer ${
                          isCurrent
                            ? 'border-[#00f2ff] bg-[#00f2ff22] text-[#00f2ff] shadow-[0_0_8px_#00f2ff22]'
                            : 'border-[#00f2ff18] bg-[#11112288] text-slate-400 hover:text-white'
                        }`}
                      >
                        <MIcon className="w-3 h-3" />
                        <span className="text-[9px] font-bold">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Hint */}
              <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1">
                <span>Shortcut: Alt + Q</span>
                <span className="text-[#00f2ff]">A.E.T.H.E.R. COMET CORE</span>
              </div>
            </div>
          </CometBorderTracer>
        )}

        {/* Floating Trigger Dock Bar */}
        <div
          id="quick-action-floating-trigger"
          className="flex items-center gap-2 p-1 rounded-full border border-[#00f2ff44] bg-[#050508ee] backdrop-blur-xl shadow-[0_0_25px_rgba(0,242,255,0.25)] transition hover:border-[#00f2ff88]"
        >
          {/* Mode Indicator Beacon */}
          <div className="flex items-center gap-1.5 pl-2.5 pr-1 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f2ff] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f2ff]" />
            </span>
            <span className="text-[10px] font-bold text-[#00f2ff] uppercase tracking-wider hidden sm:inline">
              [{currentMode}]
            </span>
          </div>

          {/* Primary Direct Mode Action (One-Click Trigger) */}
          <button
            onClick={modeData.primaryAction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00f2ff] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition shadow-[0_0_12px_#00f2ff] cursor-pointer"
            title={`Trigger primary action: ${modeData.primaryActionLabel}`}
          >
            <PrimaryActionIcon className="w-3.5 h-3.5" />
            <span>{modeData.primaryActionLabel}</span>
          </button>

          {/* Toggle Full Quick Action Drawer */}
          <button
            onClick={() => {
              if (soundEffects) playSound(!isOpen ? 'boot' : 'click');
              setIsOpen(!isOpen);
            }}
            className={`p-1.5 rounded-full border transition flex items-center justify-center cursor-pointer ${
              isOpen
                ? 'border-[#00f2ff] bg-[#00f2ff22] text-[#00f2ff]'
                : 'border-[#00f2ff33] bg-[#111122] text-slate-300 hover:text-white hover:border-[#00f2ff]'
            }`}
            title="Expand Context-Aware Quick Action Menu [Alt + Q]"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  );
};
