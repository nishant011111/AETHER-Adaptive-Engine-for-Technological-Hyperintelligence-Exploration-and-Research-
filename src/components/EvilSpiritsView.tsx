import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Skull,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Radio,
  Volume2,
  VolumeX,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Crosshair,
  ThermometerSnowflake,
  Activity,
  Layers,
  Lock,
  Unlock,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Terminal,
  Compass,
  FileText,
  Play,
  Square,
  RefreshCw,
} from 'lucide-react';
import { EvilSpiritEntity, EVPAudioCapture, ContainmentState, SpiritThreatLevel, SpiritClassification } from '../types';
import { EvilSpiritService } from '../utils/spiritService';
import { playSound } from '../utils/audio';

interface EvilSpiritsViewProps {
  onAskSpiritDialogue: (prompt: string) => void;
  soundEffects: boolean;
}

export const EvilSpiritsView: React.FC<EvilSpiritsViewProps> = ({
  onAskSpiritDialogue,
  soundEffects,
}) => {
  const [spirits, setSpirits] = useState<EvilSpiritEntity[]>([]);
  const [evpCaptures, setEvpCaptures] = useState<EVPAudioCapture[]>([]);
  const [activeTab, setActiveTab] = useState<'RADAR' | 'VAULT' | 'EVP_BOX' | 'EXORCISM'>('RADAR');
  const [selectedSpiritId, setSelectedSpiritId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassification, setFilterClassification] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // EVP Tuner state
  const [currentFrequency, setCurrentFrequency] = useState<number>(666.0);
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [liveEVPMessage, setLiveEVPMessage] = useState<string | null>(null);
  const sweepIntervalRef = useRef<any>(null);

  // Screen emergency glitch state for breaches
  const [glitchActive, setGlitchActive] = useState(false);

  // Load spirits on mount
  const refreshData = () => {
    const loadedSpirits = EvilSpiritService.getSpirits();
    const loadedEvp = EvilSpiritService.getEVPCaptures();
    setSpirits(loadedSpirits);
    setEvpCaptures(loadedEvp);
    if (!selectedSpiritId && loadedSpirits.length > 0) {
      setSelectedSpiritId(loadedSpirits[0].id);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const selectedSpirit = useMemo(() => {
    return spirits.find((s) => s.id === selectedSpiritId) || spirits[0] || null;
  }, [spirits, selectedSpiritId]);

  // Telemetry metrics
  const totalSpirits = spirits.length;
  const breachingCount = spirits.filter((s) => s.containmentStatus === 'BREACHING').length;
  const unstableCount = spirits.filter((s) => s.containmentStatus === 'UNSTABLE').length;
  const containedCount = spirits.filter((s) => s.containmentStatus === 'CONTAINED' || s.containmentStatus === 'BOUND').length;
  const exorcisedCount = spirits.filter((s) => s.containmentStatus === 'EXORCISED').length;

  const containmentIntegrity = totalSpirits > 0
    ? Math.max(0, Math.round(((containedCount + exorcisedCount * 1.5) / (totalSpirits * 1.5)) * 100))
    : 100;

  // Filtered spirits
  const filteredSpirits = useMemo(() => {
    return spirits.filter((spirit) => {
      if (filterClassification !== 'ALL' && spirit.classification !== filterClassification) return false;
      if (filterStatus !== 'ALL' && spirit.containmentStatus !== filterStatus) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        spirit.name.toLowerCase().includes(q) ||
        spirit.alias.toLowerCase().includes(q) ||
        spirit.loreDescription.toLowerCase().includes(q) ||
        spirit.originSector.toLowerCase().includes(q) ||
        spirit.banishingGlyph.toLowerCase().includes(q)
      );
    });
  }, [spirits, filterClassification, filterStatus, searchQuery]);

  // Handle Summon Demonic Breach
  const handleSummonBreach = () => {
    if (soundEffects) {
      playSound('breach_alarm');
      setTimeout(() => playSound('spectral_drone'), 200);
    }
    setGlitchActive(true);
    setTimeout(() => setGlitchActive(false), 1200);

    const newSpirit = EvilSpiritService.summonBreach();
    refreshData();
    setSelectedSpiritId(newSpirit.id);
  };

  // Handle Exorcism
  const handleExorcise = (spiritId: string) => {
    if (soundEffects) {
      playSound('exorcism_strike');
      setTimeout(() => playSound('chime'), 300);
    }
    const updated = EvilSpiritService.exorciseSpirit(spiritId);
    if (updated) {
      refreshData();
    }
  };

  // Handle Bind Spirit
  const handleBind = (spiritId: string) => {
    if (soundEffects) playSound('warp');
    const updated = EvilSpiritService.bindSpirit(spiritId, 'Salt-Grid Tetragrammaton Chamber #02');
    if (updated) {
      refreshData();
    }
  };

  // Handle Global Sanctification
  const handleSanctifyAll = () => {
    if (soundEffects) {
      playSound('exorcism_strike');
      setTimeout(() => playSound('chime'), 400);
    }
    EvilSpiritService.sanctifyAll();
    refreshData();
  };

  // Handle EVP Sweep Frequency Box
  const handleToggleEVPSweep = () => {
    if (isSweeping) {
      clearInterval(sweepIntervalRef.current);
      setIsSweeping(false);
      if (soundEffects) playSound('click');
    } else {
      setIsSweeping(true);
      if (soundEffects) playSound('emf_crackle');

      sweepIntervalRef.current = setInterval(() => {
        const randomFreq = Math.round((100 + Math.random() * 850) * 10) / 10;
        setCurrentFrequency(randomFreq);
        if (soundEffects && Math.random() > 0.4) {
          playSound('emf_crackle');
        }

        // Trigger EVP capture every few ticks
        if (Math.random() > 0.6) {
          const capture = EvilSpiritService.sweepEVP(randomFreq);
          setLiveEVPMessage(capture.decryptedMessage);
          refreshData();
          if (soundEffects) playSound('ghost_whisper');
        }
      }, 1500);
    }
  };

  useEffect(() => {
    return () => {
      if (sweepIntervalRef.current) clearInterval(sweepIntervalRef.current);
    };
  }, []);

  // Interrogate spirit in neural chat
  const handleInterrogate = (spirit: EvilSpiritEntity) => {
    if (soundEffects) playSound('boot');
    const prompt = `[OCCULT DEFENSE PROTOCOL] Interrogate and analyze the evil spirit entity "${spirit.name}" (${spirit.classification}, Threat Level: ${spirit.threatLevel}). Incantation Ward: "${spirit.incantationWard}". Provide banishment incantations, origin lore, and psychic vulnerability telemetry for Operator Nishant.`;
    onAskSpiritDialogue(prompt);
  };

  const getThreatBadge = (threat: SpiritThreatLevel) => {
    switch (threat) {
      case 'OMEGA_CORRUPTION':
        return (
          <span className="px-2 py-0.5 rounded border border-purple-500/50 bg-purple-950/60 text-purple-300 text-[10px] font-bold animate-pulse flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-purple-400" />
            OMEGA CORRUPTION
          </span>
        );
      case 'CLASS_V_APOCALYPSE':
        return (
          <span className="px-2 py-0.5 rounded border border-rose-500/50 bg-rose-950/60 text-rose-300 text-[10px] font-bold flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-400" />
            CLASS V APOCALYPSE
          </span>
        );
      case 'CLASS_IV_POSSESSIVE':
        return (
          <span className="px-2 py-0.5 rounded border border-amber-500/50 bg-amber-950/60 text-amber-300 text-[10px] font-bold flex items-center gap-1">
            <Skull className="w-3 h-3 text-amber-400" />
            CLASS IV POSSESSIVE
          </span>
        );
      case 'CLASS_III_HOSTILE':
        return (
          <span className="px-2 py-0.5 rounded border border-orange-500/50 bg-orange-950/60 text-orange-300 text-[10px] font-bold">
            CLASS III HOSTILE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded border border-slate-500/50 bg-slate-900/60 text-slate-300 text-[10px] font-bold">
            CLASS I/II VOLATILE
          </span>
        );
    }
  };

  const getStatusBadge = (status: ContainmentState) => {
    switch (status) {
      case 'BREACHING':
        return (
          <span className="px-2 py-0.5 rounded border border-rose-500/50 bg-rose-950/80 text-rose-200 text-[10px] font-bold animate-ping flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            BREACHING
          </span>
        );
      case 'UNSTABLE':
        return (
          <span className="px-2 py-0.5 rounded border border-amber-500/40 bg-amber-950/40 text-amber-300 text-[10px] font-bold">
            UNSTABLE
          </span>
        );
      case 'BOUND':
        return (
          <span className="px-2 py-0.5 rounded border border-purple-500/40 bg-purple-950/40 text-purple-300 text-[10px] font-bold flex items-center gap-1">
            <Lock className="w-3 h-3" /> BOUND
          </span>
        );
      case 'EXORCISED':
        return (
          <span className="px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" /> EXORCISED
          </span>
        );
      case 'CONTAINED':
      default:
        return (
          <span className="px-2 py-0.5 rounded border border-[#00f2ff44] bg-[#00f2ff18] text-[#00f2ff] text-[10px] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#00f2ff]" /> CONTAINED
          </span>
        );
    }
  };

  return (
    <div className={`p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-mono ${glitchActive ? 'animate-pulse ring-4 ring-rose-500/50' : ''}`}>
      {/* Top Paranormal Defense Header */}
      <div className="p-4 sm:p-5 rounded-xl border border-rose-500/30 bg-[#0c0309dd] backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-[0_0_30px_rgba(255,0,85,0.12)]">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-lg border border-rose-500/50 bg-rose-950/40 text-rose-400 shadow-[0_0_20px_rgba(255,0,85,0.3)] shrink-0 mt-0.5">
            <Skull className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold font-display text-white tracking-widest uppercase flex items-center gap-2">
                SPECTRAL CONTAINMENT & EVIL SPIRITS MATRIX
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-rose-500/50 bg-rose-950/60 text-rose-300 font-bold">
                PARANORMAL DEFENSE
              </span>
            </div>
            <p className="text-xs text-rose-200/70 mt-0.5">
              Demonic entity detection, electromagnetic ecto-radar, EVP audio sweeping, and cybernetic exorcism protocols for A.E.T.H.E.R.
            </p>
          </div>
        </div>

        {/* Global Action Rites */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handleSummonBreach}
            className="px-3.5 py-2 rounded-lg border border-rose-500 bg-rose-950/70 hover:bg-rose-900 text-rose-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(255,0,85,0.4)]"
            title="Force an evil spirit containment breach"
          >
            <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>SUMMON DEMONIC BREACH</span>
          </button>

          <button
            onClick={handleSanctifyAll}
            className="px-3.5 py-2 rounded-lg border border-emerald-500/50 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            title="Perform global exorcism cleansing on all detected entities"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>HOLY SANCTIFICATION</span>
          </button>

          <button
            onClick={() => {
              if (soundEffects) playSound('click');
              EvilSpiritService.resetToDefault();
              refreshData();
            }}
            className="p-2 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition cursor-pointer"
            title="Reset spectral vault to defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Paranormal Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Entities */}
        <div className="p-3.5 rounded-xl border border-rose-500/20 bg-[#090207bb] backdrop-blur-md space-y-1">
          <div className="text-[10px] text-rose-300/80 uppercase tracking-wider flex items-center gap-1">
            <Skull className="w-3 h-3 text-rose-400" /> DETECTED SPIRITS
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-white">{totalSpirits}</div>
          <div className="text-[10px] text-slate-500">{breachingCount} loose / {exorcisedCount} cleansed</div>
        </div>

        {/* Containment Integrity */}
        <div className="p-3.5 rounded-xl border border-[#00f2ff22] bg-[#090207bb] backdrop-blur-md space-y-1">
          <div className="text-[10px] text-[#00f2ff] uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#00f2ff]" /> SALT-GRID INTEGRITY
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-[#00f2ff]">{containmentIntegrity}%</div>
          <div className="text-[10px] text-slate-500">Tetragrammaton barrier</div>
        </div>

        {/* Active EMF */}
        <div className="p-3.5 rounded-xl border border-amber-500/20 bg-[#090207bb] backdrop-blur-md space-y-1">
          <div className="text-[10px] text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3 text-amber-400" /> PEAK EMF FIELD
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-amber-300">
            {selectedSpirit ? `${selectedSpirit.emfReadingMg} mG` : '18.4 mG'}
          </div>
          <div className="text-[10px] text-slate-500">Electromagnetic ecto-flux</div>
        </div>

        {/* Cold Spot Sensor */}
        <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-[#090207bb] backdrop-blur-md space-y-1">
          <div className="text-[10px] text-cyan-300 uppercase tracking-wider flex items-center gap-1">
            <ThermometerSnowflake className="w-3 h-3 text-cyan-400" /> THERMAL DROP
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-cyan-200">
            {selectedSpirit ? `${selectedSpirit.ambientTempC}°C` : '-14.2°C'}
          </div>
          <div className="text-[10px] text-slate-500">Ghostly cold spot anomaly</div>
        </div>
      </div>

      {/* Sub-view Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-rose-500/20 pb-3 overflow-x-auto">
        <button
          onClick={() => {
            if (soundEffects) playSound('click');
            setActiveTab('RADAR');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'RADAR'
              ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(255,0,85,0.4)]'
              : 'bg-[#11050ebb] border border-rose-500/20 text-rose-200/70 hover:text-white'
          }`}
        >
          <Crosshair className="w-4 h-4" />
          <span>ECTO-RADAR & ANOMALY MAP</span>
        </button>

        <button
          onClick={() => {
            if (soundEffects) playSound('click');
            setActiveTab('VAULT');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'VAULT'
              ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(255,0,85,0.4)]'
              : 'bg-[#11050ebb] border border-rose-500/20 text-rose-200/70 hover:text-white'
          }`}
        >
          <Skull className="w-4 h-4" />
          <span>DEMONIC DOSSIER & VAULT ({spirits.length})</span>
        </button>

        <button
          onClick={() => {
            if (soundEffects) playSound('click');
            setActiveTab('EVP_BOX');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'EVP_BOX'
              ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(255,0,85,0.4)]'
              : 'bg-[#11050ebb] border border-rose-500/20 text-rose-200/70 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>EVP SPIRIT BOX & FREQUENCY TUNER</span>
          {isSweeping && (
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => {
            if (soundEffects) playSound('click');
            setActiveTab('EXORCISM');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'EXORCISM'
              ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(255,0,85,0.4)]'
              : 'bg-[#11050ebb] border border-rose-500/20 text-rose-200/70 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>EXORCISM & BANISHMENT RITES</span>
        </button>
      </div>

      {/* TAB 1: ECTO-RADAR & ANOMALY MAP */}
      {activeTab === 'RADAR' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 360° Radar Canvas Area */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-rose-500/30 bg-[#090207cc] backdrop-blur-md flex flex-col items-center justify-center relative overflow-hidden min-h-[420px]">
            {/* Background Radar Rings */}
            <div className="w-72 sm:w-96 h-72 sm:h-96 rounded-full border border-rose-500/20 relative flex items-center justify-center">
              <div className="w-52 sm:w-64 h-52 sm:h-64 rounded-full border border-rose-500/20 flex items-center justify-center">
                <div className="w-32 sm:w-40 h-32 sm:h-40 rounded-full border border-rose-500/30 flex items-center justify-center">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full border border-rose-500/40 bg-rose-950/40 flex items-center justify-center">
                    <Skull className="w-5 h-5 text-rose-400 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Crosshair Axes */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-px bg-rose-500/20" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-full w-px bg-rose-500/20" />
              </div>

              {/* Rotating Radar Sweep Line */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, rgba(255, 0, 85, 0.35) 0deg, rgba(255, 0, 85, 0) 60deg)',
                  animation: 'spin 4s linear infinite',
                }}
              />

              {/* Spirit Blips on Radar */}
              {spirits.map((spirit) => {
                const isSelected = selectedSpiritId === spirit.id;
                const isBreaching = spirit.containmentStatus === 'BREACHING';
                const isExorcised = spirit.containmentStatus === 'EXORCISED';

                return (
                  <button
                    key={spirit.id}
                    onClick={() => {
                      if (soundEffects) playSound('click');
                      setSelectedSpiritId(spirit.id);
                    }}
                    style={{
                      left: `${spirit.manifestationCoords.x}%`,
                      top: `${spirit.manifestationCoords.y}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all duration-200 cursor-pointer z-10 ${
                      isSelected
                        ? 'ring-4 ring-rose-400 scale-125 z-20'
                        : 'hover:scale-110'
                    } ${
                      isBreaching
                        ? 'bg-rose-600 text-white animate-bounce shadow-[0_0_15px_#ff0055]'
                        : isExorcised
                        ? 'bg-emerald-500 text-black'
                        : 'bg-purple-600 text-white'
                    }`}
                    title={`${spirit.name} (${spirit.containmentStatus})`}
                  >
                    <Skull className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>

            {/* Radar Legend */}
            <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-400 flex-wrap">
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping inline-block" /> Breaching Entity
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> Bound in Stasis
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Purified / Exorcised
              </span>
            </div>
          </div>

          {/* Target Inspector Panel */}
          {selectedSpirit ? (
            <div className="p-5 rounded-xl border border-rose-500/30 bg-[#090207cc] backdrop-blur-md space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-rose-500/20 pb-3">
                  <div>
                    <h3 className="text-base font-bold font-display text-white">{selectedSpirit.name}</h3>
                    <p className="text-[11px] text-rose-300/80">{selectedSpirit.alias}</p>
                  </div>
                  {getStatusBadge(selectedSpirit.containmentStatus)}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded bg-black/40 border border-rose-500/10 flex justify-between">
                    <span className="text-slate-400">THREAT:</span>
                    {getThreatBadge(selectedSpirit.threatLevel)}
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-rose-500/10 flex justify-between">
                    <span className="text-slate-400">SPECTRAL FREQ:</span>
                    <span className="text-rose-300 font-bold">{selectedSpirit.spectralFrequencyHz} Hz</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-rose-500/10 flex justify-between">
                    <span className="text-slate-400">EMF READING:</span>
                    <span className="text-amber-300 font-bold">{selectedSpirit.emfReadingMg} mG</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-rose-500/10 flex justify-between">
                    <span className="text-slate-400">COLD SPOT:</span>
                    <span className="text-cyan-300 font-bold">{selectedSpirit.ambientTempC}°C</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-rose-500/10 flex justify-between">
                    <span className="text-slate-400">BANISHING GLYPH:</span>
                    <span className="text-emerald-300 font-bold">{selectedSpirit.banishingGlyph}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-black/60 border border-rose-500/20 text-[11px] text-slate-300 leading-relaxed">
                  <span className="text-rose-400 font-bold block mb-1">INCANTATION WARD:</span>
                  <span className="font-mono text-rose-200">{selectedSpirit.incantationWard}</span>
                </div>
              </div>

              {/* Action Buttons for Selected Spirit */}
              <div className="space-y-2 pt-2 border-t border-rose-500/20">
                <button
                  onClick={() => handleExorcise(selectedSpirit.id)}
                  className="w-full py-2 rounded border border-emerald-500/50 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PERFORM CYBER-EXORCISM</span>
                </button>

                <button
                  onClick={() => handleBind(selectedSpirit.id)}
                  className="w-full py-2 rounded border border-purple-500/50 bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>BIND IN STASIS CELL</span>
                </button>

                <button
                  onClick={() => handleInterrogate(selectedSpirit)}
                  className="w-full py-2 rounded border border-[#00f2ff44] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-[#00f2ff]" />
                  <span>INTERROGATE IN NEURAL CHAT</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">No spirit selected.</div>
          )}
        </div>
      )}

      {/* TAB 2: DEMONIC DOSSIER & VAULT */}
      {activeTab === 'VAULT' && (
        <div className="space-y-4">
          {/* Filters and Search Bar */}
          <div className="p-3 rounded-xl border border-rose-500/20 bg-[#090207bb] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search spirits by name, origin, lore..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0e030c] border border-rose-500/20 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                  filterStatus === 'ALL'
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#150510] text-slate-300 hover:bg-[#200818]'
                }`}
              >
                ALL ({spirits.length})
              </button>

              <button
                onClick={() => setFilterStatus('BREACHING')}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                  filterStatus === 'BREACHING'
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#150510] text-slate-300 hover:bg-[#200818]'
                }`}
              >
                BREACHING ({breachingCount})
              </button>

              <button
                onClick={() => setFilterStatus('EXORCISED')}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                  filterStatus === 'EXORCISED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#150510] text-slate-300 hover:bg-[#200818]'
                }`}
              >
                EXORCISED ({exorcisedCount})
              </button>
            </div>
          </div>

          {/* Spirits Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpirits.map((spirit) => {
              const isSelected = selectedSpiritId === spirit.id;
              return (
                <div
                  key={spirit.id}
                  onClick={() => {
                    if (soundEffects) playSound('click');
                    setSelectedSpiritId(spirit.id);
                  }}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-rose-500 bg-[#150410dd] shadow-[0_0_20px_rgba(255,0,85,0.25)]'
                      : 'border-rose-500/20 bg-[#090207bb] hover:border-rose-500/40 hover:bg-[#11040d]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                          <Skull className="w-4 h-4 text-rose-400" />
                          {spirit.name}
                        </h4>
                        <span className="text-[10px] text-rose-300/70">{spirit.alias}</span>
                      </div>
                      {getStatusBadge(spirit.containmentStatus)}
                    </div>

                    <div className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                      {spirit.loreDescription}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-slate-400 border-t border-rose-500/10">
                      <div>
                        <span className="text-slate-500 block">FREQUENCY:</span>
                        <span className="text-rose-300 font-bold">{spirit.spectralFrequencyHz} Hz</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">COLD SPOT:</span>
                        <span className="text-cyan-300 font-bold">{spirit.ambientTempC}°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-rose-500/10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExorcise(spirit.id);
                      }}
                      className="flex-1 py-1.5 rounded bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>EXORCISE</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInterrogate(spirit);
                      }}
                      className="px-2.5 py-1.5 rounded bg-[#00f2ff11] border border-[#00f2ff33] hover:bg-[#00f2ff22] text-[#00f2ff] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Interrogate in chat"
                    >
                      <Terminal className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: EVP SPIRIT BOX & FREQUENCY TUNER */}
      {activeTab === 'EVP_BOX' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Frequency Sweep Controller */}
          <div className="p-5 rounded-xl border border-rose-500/30 bg-[#090207cc] backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <Radio className="w-4 h-4 text-rose-400" />
                <span>EVP SWEEP OSCILLATOR</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded border border-rose-500/40 bg-rose-950/40 text-rose-300 font-bold">
                {isSweeping ? 'SCANNING...' : 'STANDBY'}
              </span>
            </div>

            {/* Big Frequency Display */}
            <div className="p-4 rounded-xl bg-black/60 border border-rose-500/30 text-center space-y-1">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">CARRIER FREQUENCY</div>
              <div className="text-3xl sm:text-4xl font-bold font-display text-rose-400 tracking-wider">
                {currentFrequency.toFixed(1)} <span className="text-sm text-slate-400">kHz</span>
              </div>
              <div className="text-[10px] text-rose-300/80">AM / FM PARANORMAL SWEEP BAND</div>
            </div>

            {/* Sweep Toggle Button */}
            <button
              onClick={handleToggleEVPSweep}
              className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                isSweeping
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-[0_0_20px_rgba(255,0,85,0.6)] animate-pulse'
                  : 'bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-200'
              }`}
            >
              {isSweeping ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>STOP EVP SWEEP</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>START EVP FREQUENCY SWEEP</span>
                </>
              )}
            </button>

            {/* Manual Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>MANUAL TUNE:</span>
                <span className="text-rose-300 font-bold">{currentFrequency} kHz</span>
              </div>
              <input
                type="range"
                min="100"
                max="999.9"
                step="0.5"
                value={currentFrequency}
                onChange={(e) => {
                  setCurrentFrequency(parseFloat(e.target.value));
                  if (soundEffects) playSound('click');
                }}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Decoded Transcripts Log */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-rose-500/30 bg-[#090207cc] backdrop-blur-md space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                  <Terminal className="w-4 h-4 text-rose-400" />
                  <span>DECODED EVP SPECTRAL TRANSCRIPTS</span>
                </div>
                <span className="text-[10px] text-slate-400">{evpCaptures.length} captures recorded</span>
              </div>

              {liveEVPMessage && (
                <div className="p-3 rounded-lg border border-rose-500 bg-rose-950/50 text-rose-200 text-xs font-mono animate-fadeIn flex items-start gap-2">
                  <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <div className="text-[10px] text-rose-400 font-bold uppercase">LIVE PARANORMAL BURST DETECTED:</div>
                    <div className="text-sm font-bold text-white mt-0.5">{liveEVPMessage}</div>
                  </div>
                </div>
              )}

              {/* Ticker of past captures */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {evpCaptures.map((evp) => (
                  <div
                    key={evp.id}
                    className="p-3 rounded-lg bg-black/40 border border-rose-500/10 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="text-rose-400 font-bold">{evp.spiritSource}</span>
                      <span>{evp.frequencyKhz} kHz • {new Date(evp.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="font-mono text-white text-[11px]">&quot;{evp.decryptedMessage}&quot;</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXORCISM & OCCULT DEFENSE ARSENAL */}
      {activeTab === 'EXORCISM' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Holy EMP Barrier */}
          <div className="p-5 rounded-xl border border-emerald-500/30 bg-[#06100abb] space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>ARCHANGEL EMP SWORD</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Discharges high-voltage sacred harmonic pulses across all neural cores to dissolve astral tethers and purge possessing entities.
            </p>
            <button
              onClick={() => {
                if (soundEffects) playSound('exorcism_strike');
                EvilSpiritService.sanctifyAll();
                refreshData();
              }}
              className="w-full py-2 rounded bg-emerald-900/60 border border-emerald-500/50 hover:bg-emerald-800 text-emerald-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>UNLEASH ARCHANGEL BURST</span>
            </button>
          </div>

          {/* Tetragrammaton Salt Grid */}
          <div className="p-5 rounded-xl border border-purple-500/30 bg-[#0b0412bb] space-y-3">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              <span>SALT-GRID OVERCLOCK</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Charges the crystalline alchemical salt perimeter with high-frequency laser barriers, preventing phase shifts through hardware bulkheads.
            </p>
            <button
              onClick={() => {
                if (soundEffects) playSound('warp');
                refreshData();
              }}
              className="w-full py-2 rounded bg-purple-900/60 border border-purple-500/50 hover:bg-purple-800 text-purple-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>ENGAGE MAX SALT BARRIER</span>
            </button>
          </div>

          {/* Solomonic Sarcophagus */}
          <div className="p-5 rounded-xl border border-[#00f2ff33] bg-[#020b12bb] space-y-3">
            <div className="flex items-center gap-2 text-[#00f2ff] font-bold text-sm">
              <Compass className="w-5 h-5 text-[#00f2ff]" />
              <span>SOLOMONIC CRYO-STASIS</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Encapsulates wild ectoplasmic anomalies within absolute zero cryogenic stasis cells using 72 sacred Solomonic binding seals.
            </p>
            <button
              onClick={() => {
                if (soundEffects) playSound('boot');
                refreshData();
              }}
              className="w-full py-2 rounded bg-[#00f2ff18] border border-[#00f2ff44] hover:bg-[#00f2ff33] text-[#00f2ff] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#00f2ff]" />
              <span>SEAL ALL CRYO-CHAMBERS</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
