import React from 'react';
import {
  Compass,
  MessageSquare,
  ShieldAlert,
  Code2,
  Atom,
  Rocket,
  Navigation,
  Activity,
  FolderGit2,
  ListTodo,
  Brain,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Skull,
} from 'lucide-react';
import { CommandMode } from '../types';
import { playSound } from '../utils/audio';

interface SidebarProps {
  currentMode: CommandMode;
  onSelectMode: (mode: CommandMode) => void;
  isOpen: boolean;
  onToggle: () => void;
  soundEffects: boolean;
}

interface NavItem {
  id: CommandMode;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onSelectMode,
  isOpen,
  onToggle,
  soundEffects,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'COMMAND CORE',
      sublabel: 'Central Reactor',
      icon: <Compass className="w-3.5 h-3.5" />,
      badge: 'CORE',
    },
    {
      id: 'control',
      label: 'SYSTEM CONTROL',
      sublabel: 'Root Modification & Tuning',
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      badge: 'ROOT',
    },
    {
      id: 'chat',
      label: 'CONVERSATION',
      sublabel: 'Neural Matrix',
      icon: <MessageSquare className="w-3.5 h-3.5" />,
    },
    {
      id: 'coding',
      label: 'CODING MODE',
      sublabel: 'Synthesizer & Debugger',
      icon: <Code2 className="w-3.5 h-3.5" />,
      badge: 'DEV',
    },
    {
      id: 'research',
      label: 'RESEARCH LAB',
      sublabel: 'Astrophysics & Deep STEM',
      icon: <Atom className="w-3.5 h-3.5" />,
      badge: 'DEEP',
    },
    {
      id: 'space',
      label: 'SPACE MODE',
      sublabel: 'ISRO & Global Missions',
      icon: <Rocket className="w-3.5 h-3.5" />,
      badge: 'ISRO',
    },
    {
      id: 'maps',
      label: 'GPS & TACTICAL MAP',
      sublabel: 'Live GNSS & Ground Stations',
      icon: <Navigation className="w-3.5 h-3.5" />,
      badge: 'GPS',
    },
    {
      id: 'spirits',
      label: 'EVIL SPIRITS',
      sublabel: 'Spectral Anomaly Matrix',
      icon: <Skull className="w-3.5 h-3.5 text-rose-400" />,
      badge: 'PARANORMAL',
    },
    {
      id: 'projects',
      label: 'PROJECTS',
      sublabel: 'Tasks & Milestones',
      icon: <FolderGit2 className="w-3.5 h-3.5" />,
      badge: 'ACTIVE',
    },
    {
      id: 'tasks',
      label: 'GOOGLE TASKS',
      sublabel: 'Workspace Sync & Matrix',
      icon: <ListTodo className="w-3.5 h-3.5" />,
      badge: 'G-TASKS',
    },
    {
      id: 'memory',
      label: 'MEMORY',
      sublabel: 'Neural Matrix Cache',
      icon: <Brain className="w-3.5 h-3.5" />,
    },
    {
      id: 'system',
      label: 'SYSTEM MONITOR',
      sublabel: 'Live Telemetry Sensors',
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    {
      id: 'settings',
      label: 'SETTINGS',
      sublabel: 'Voice & Neural Config',
      icon: <Sliders className="w-3.5 h-3.5" />,
    },
  ];

  const handleModeClick = (mode: CommandMode) => {
    if (soundEffects) playSound('click');
    onSelectMode(mode);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <nav
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 transition-all duration-300 ease-in-out flex flex-col justify-between border-r border-[#00f2ff22] glass-hologram-sidebar p-4 ${
          isOpen ? 'w-56 sm:w-60 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
        }`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-[10px] font-bold text-white uppercase tracking-[0.3em] opacity-70 truncate ${
                !isOpen && 'lg:hidden'
              }`}
            >
              Command Center
            </h2>
            <button
              onClick={() => {
                if (soundEffects) playSound('click');
                onToggle();
              }}
              className="p-1 rounded text-[#00f2ff] opacity-60 hover:opacity-100 transition hidden lg:block"
              title={isOpen ? 'Collapse Navigation' : 'Expand Navigation'}
            >
              {isOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation Items */}
          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-190px)]">
            {navItems.map((item) => {
              const isActive = currentMode === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleModeClick(item.id)}
                  className={`group flex items-center px-3 py-2 text-xs font-mono transition-all cursor-pointer rounded-sm ${
                    isActive
                      ? 'bg-[#00f2ff11] border-l-2 border-[#00f2ff] text-[#00f2ff] opacity-100'
                      : 'opacity-50 hover:opacity-100 text-slate-300 hover:text-white hover:bg-[#ffffff08]'
                  }`}
                  title={!isOpen ? item.label : undefined}
                >
                  <span className={`shrink-0 mr-2.5 ${isActive ? 'text-[#00f2ff]' : 'text-slate-400 group-hover:text-[#00f2ff]'}`}>
                    {item.icon}
                  </span>

                  {isOpen && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate tracking-wider text-[11px] font-medium">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[8px] font-mono px-1 py-0.2 rounded border ${
                            isActive
                              ? 'border-[#00f2ff44] text-[#00f2ff] bg-[#00f2ff11]'
                              : 'border-[#ffffff18] text-slate-400 bg-black/40'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Protocol Footer Box */}
        {isOpen ? (
          <div className="mt-auto p-3 bg-[#111122] rounded border border-[#00f2ff22] select-none">
            <div className="text-[9px] uppercase tracking-widest opacity-50 mb-1 text-[#00f2ff]">
              Active Protocol
            </div>
            <div className="text-[11px] font-mono text-white font-semibold flex items-center justify-between">
              <span>NEURAL_SYNC_04</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] shadow-[0_0_5px_#00f2ff] animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="mt-auto flex justify-center py-2">
            <span className="w-2 h-2 rounded-full bg-[#00f2ff] shadow-[0_0_6px_#00f2ff]" />
          </div>
        )}
      </nav>
    </>
  );
};
