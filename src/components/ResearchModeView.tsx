import React, { useState } from 'react';
import {
  Atom,
  Sparkles,
  Search,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface ResearchModeViewProps {
  onAskResearch: (prompt: string) => void;
  soundEffects: boolean;
}

export const ResearchModeView: React.FC<ResearchModeViewProps> = ({
  onAskResearch,
  soundEffects,
}) => {
  const [researchQuery, setResearchQuery] = useState('');

  const researchTopics = [
    {
      category: 'Astrophysics & Cosmology',
      title: 'Dark Matter Candidates & Axion Search Protocols',
      summary: 'Analysis of WIMP vs Axion particle candidates and gravitational lensing cosmological signatures.',
      epistemic: { fact: '85% of cosmic matter is non-baryonic', inference: 'QCD axions solve strong CP problem' },
    },
    {
      category: 'Quantum Computing',
      title: 'Fault-Tolerant Surface Codes & Majorana Anyons',
      summary: 'Topological quantum error correction thresholds and braiding non-Abelian statistics.',
      epistemic: { fact: 'Threshold error rates near 1%', inference: 'Topological protection reduces physical qubit overhead' },
    },
    {
      category: 'Propulsion Systems',
      title: 'Nuclear Thermal (NTP) & Pulsed Fusion Engines',
      summary: 'Specific impulse comparisons (Isp > 900s for NTP) for crewed Mars & outer planet transfers.',
      epistemic: { fact: 'NTP achieves 2x Isp of chemical rockets', inference: 'Cuts transit time to Mars by 50%' },
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto font-mono">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg border border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff] shadow-[0_0_15px_#00f2ff22]">
            <Atom className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold font-display text-white tracking-widest uppercase">
              A.E.T.H.E.R. SCIENTIFIC RESEARCH LAB
            </h1>
            <p className="text-xs text-slate-400">
              Rigorous STEM exploration, source-grounded investigations, and epistemically categorized intelligence for Nishant.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-3 py-1 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff] uppercase font-bold tracking-wider">
            EPISTEMIC AUDIT: STRICT
          </span>
        </div>
      </div>

      {/* Epistemic Protocol Guide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-[#111122] space-y-1">
          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" /> KNOWN FACT
          </span>
          <p className="text-[10px] text-slate-400">Verified empirical laws & established consensus.</p>
        </div>

        <div className="p-2.5 rounded-lg border border-[#00f2ff33] bg-[#111122] space-y-1">
          <span className="text-[#00f2ff] font-bold flex items-center gap-1 text-[11px]">
            <BookOpen className="w-3.5 h-3.5" /> SOURCE-BASED
          </span>
          <p className="text-[10px] text-slate-400">Derived directly from peer-reviewed literature & data.</p>
        </div>

        <div className="p-2.5 rounded-lg border border-[#7000ff44] bg-[#111122] space-y-1">
          <span className="text-[#7000ff] font-bold flex items-center gap-1 text-[11px]">
            <Layers className="w-3.5 h-3.5" /> INFERENCE
          </span>
          <p className="text-[10px] text-slate-400">Logical extrapolation from validated premises.</p>
        </div>

        <div className="p-2.5 rounded-lg border border-amber-500/30 bg-[#111122] space-y-1">
          <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5" /> UNCERTAINTY
          </span>
          <p className="text-[10px] text-slate-400">Hypotheses subject to ongoing experimental proof.</p>
        </div>
      </div>

      {/* Deep Research Query Bar */}
      <div className="p-4 sm:p-5 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-3">
        <span className="text-[9px] uppercase text-[#00f2ff] opacity-80 tracking-wider">
          INITIATE DEEP SCIENTIFIC INVESTIGATION
        </span>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!researchQuery.trim()) return;
            onAskResearch(`Scientific Research Protocol: ${researchQuery}`);
            setResearchQuery('');
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={researchQuery}
            onChange={(e) => setResearchQuery(e.target.value)}
            placeholder="e.g., Investigate recent ISRO cryogenic engine advancements or Quantum decoherence suppression..."
            className="flex-1 bg-[#111122] border border-[#00f2ff33] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-[#00f2ff44] focus:outline-none focus:border-[#00f2ff]"
          />
          <button
            type="submit"
            disabled={!researchQuery.trim()}
            className="px-5 py-2.5 rounded bg-[#00f2ff] hover:bg-white text-black text-xs font-bold uppercase tracking-widest transition shadow-[0_0_8px_#00f2ff] disabled:opacity-40 shrink-0 cursor-pointer"
          >
            RESEARCH WITH GROUNDING
          </button>
        </form>
      </div>

      {/* Pre-configured Research Streams */}
      <div className="space-y-3">
        <span className="text-[9px] uppercase text-[#00f2ff] opacity-80 tracking-wider">
          FEATURED RESEARCH STREAMS FOR NISHANT
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {researchTopics.map((topic, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[9px] text-[#00f2ff] px-2 py-0.5 rounded bg-[#00f2ff11] border border-[#00f2ff33]">
                  {topic.category}
                </span>
                <h3 className="text-sm font-bold text-white font-display">{topic.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{topic.summary}</p>

                <div className="space-y-1 pt-1 text-[10px]">
                  <div className="text-emerald-400">✓ FACT: {topic.epistemic.fact}</div>
                  <div className="text-[#00f2ff]">⚡ INFERENCE: {topic.epistemic.inference}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (soundEffects) playSound('click');
                  onAskResearch(`Deep dive analysis for Nishant: ${topic.title} - ${topic.summary}`);
                }}
                className="w-full py-1.5 rounded border border-[#00f2ff44] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>OPEN RESEARCH DOSSIER</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
