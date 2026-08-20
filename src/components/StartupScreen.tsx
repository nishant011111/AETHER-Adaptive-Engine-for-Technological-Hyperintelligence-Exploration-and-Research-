import React, { useState, useEffect } from 'react';
import { Sparkles, Shield, ArrowRight, UserCheck } from 'lucide-react';
import { playSound } from '../utils/audio';
import { AuthenticatedOperator } from '../types';

interface StartupScreenProps {
  onComplete: () => void;
  soundEffects: boolean;
  operator?: AuthenticatedOperator | null;
}

export const StartupScreen: React.FC<StartupScreenProps> = ({
  onComplete,
  soundEffects,
  operator,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const operatorName = operator?.displayName || 'Nishant';
  const clearanceText = operator?.clearanceLevel || 'LEVEL 5 - PRIMARY OPERATOR';

  const bootSteps = [
    'Initializing AETHER Core Architecture...',
    'Cryptographic Security Gate Unlocked (SHA-256 Passed)...',
    `Authenticated Operator Validated: ${operatorName.toUpperCase()}...`,
    'Synchronizing Neural Weights (Gemini 3.7 Flash Engine)...',
    'Voice Interface & Waveform Synthesizer Online...',
    `Welcome back, ${operatorName}. All systems nominal.`,
  ];

  useEffect(() => {
    if (soundEffects) playSound('boot');

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < bootSteps.length - 1) {
          return prev + 1;
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, 400);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) {
          return prev + 4;
        }
        clearInterval(progressInterval);
        return 100;
      });
    }, 90);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [soundEffects, bootSteps.length]);

  const handleEnter = () => {
    if (soundEffects) playSound('chime');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050508] flex flex-col items-center justify-center p-4 text-center font-mono select-none overflow-hidden">
      {/* Background Holographic Grid & Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle at 50% 50%, #1e266d 0%, transparent 70%)' }}
      />
      <div className="absolute inset-0 bg-holo-grid opacity-30 pointer-events-none" />

      {/* Central Holographic Badge */}
      <div className="relative z-10 max-w-lg w-full p-6 sm:p-8 rounded-2xl border border-[#00f2ff33] bg-[#050508ee] backdrop-blur-xl shadow-[0_0_50px_#00f2ff18] space-y-6">
        {/* Core Icon */}
        <div className="mx-auto w-20 h-20 rounded-full border border-[#00f2ff] bg-[#00f2ff11] flex items-center justify-center shadow-[0_0_20px_#00f2ff] animate-pulse">
          <Sparkles className="w-10 h-10 text-[#00f2ff]" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-[0.2em] text-white">
            AETHER
          </h1>
          <p className="text-[9px] uppercase tracking-widest opacity-60 text-[#7000ff] font-bold">
            ADAPTIVE ENGINE FOR TECHNOLOGICAL HYPERINTELLIGENCE, EXPLORATION, AND RESEARCH
          </p>
        </div>

        {/* Operator Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00f2ff44] bg-[#00f2ff11] text-xs text-[#00f2ff]">
          <Shield className="w-3.5 h-3.5 text-[#00f2ff]" />
          <span>AUTHENTICATED OPERATOR: {operatorName.toUpperCase()}</span>
        </div>

        {/* Boot Step Logs */}
        <div className="h-24 bg-[#111122] rounded-lg border border-[#00f2ff22] p-3 text-left text-xs space-y-1 overflow-hidden">
          {bootSteps.slice(0, currentStep + 1).map((step, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 ${
                idx === currentStep ? 'text-white font-bold' : 'text-slate-500'
              }`}
            >
              <span className="text-[10px] text-[#00f2ff]">›</span>
              <span className="truncate">{step}</span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>NEURAL CORE BOOTSTRAP</span>
            <span className="text-[#00f2ff] font-bold">{progress}%</span>
          </div>
          <div className="h-1 bg-[#111122] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00f2ff] shadow-[0_0_6px_#00f2ff] transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Enter Button */}
        <button
          onClick={handleEnter}
          disabled={progress < 85}
          className="w-full py-3 rounded-lg bg-[#00f2ff] hover:bg-white text-black font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_#00f2ff] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <span>ENTER COMMAND DECK</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

