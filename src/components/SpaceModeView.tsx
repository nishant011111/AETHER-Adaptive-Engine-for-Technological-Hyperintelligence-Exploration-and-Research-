import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Globe,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Satellite,
  Compass,
} from 'lucide-react';
import { SpaceMission, AstronomyEvent } from '../types';
import { playSound } from '../utils/audio';

interface SpaceModeViewProps {
  onAskSpace: (prompt: string) => void;
  soundEffects: boolean;
}

export const SpaceModeView: React.FC<SpaceModeViewProps> = ({ onAskSpace, soundEffects }) => {
  const [missions, setMissions] = useState<SpaceMission[]>([]);
  const [astronomyEvents, setAstronomyEvents] = useState<AstronomyEvent[]>([]);
  const [selectedMission, setSelectedMission] = useState<SpaceMission | null>(null);
  const [activeTab, setActiveTab] = useState<'ISRO' | 'GLOBAL' | 'ASTRONOMY'>('ISRO');

  useEffect(() => {
    fetch('/api/space/missions')
      .then((res) => res.json())
      .then((data) => {
        if (data.missions) {
          setMissions(data.missions);
          setSelectedMission(data.missions[0]);
        }
        if (data.astronomyEvents) {
          setAstronomyEvents(data.astronomyEvents);
        }
      })
      .catch((err) => console.error('Space data error:', err));
  }, []);

  const isroMissions = missions.filter((m) => m.agency.includes('ISRO'));
  const globalMissions = missions.filter((m) => !m.agency.includes('ISRO') || m.agency.includes('NASA'));

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto font-mono">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg border border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff] shadow-[0_0_15px_#00f2ff22]">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold font-display text-white tracking-widest uppercase">
              A.E.T.H.E.R. SPACE COMMAND // ISRO & GLOBAL MISSIONS
            </h1>
            <p className="text-xs text-slate-400">
              Deep space telemetry, orbital mechanics, mission flight plans, and celestial astronomy radar for Nishant.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-3 py-1 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff] uppercase font-bold tracking-wider">
            RADAR: TRACKING
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#00f2ff22] pb-2">
        <button
          onClick={() => {
            if (soundEffects) playSound('click');
            setActiveTab('ISRO');
          }}
          className={`px-4 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
            activeTab === 'ISRO'
              ? 'bg-[#00f2ff11] border-l-2 border-[#00f2ff] text-[#00f2ff] shadow-[0_0_10px_#00f2ff22]'
              : 'border-[#00f2ff18] bg-[#11112288] text-slate-400 hover:text-white'
          }`}
        >
          <Satellite className="w-3.5 h-3.5 text-[#00f2ff]" />
          <span>ISRO MISSIONS ({isroMissions.length})</span>
        </button>

        <button
          onClick={() => {
            if (soundEffects) playSound('click');
            setActiveTab('GLOBAL');
          }}
          className={`px-4 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
            activeTab === 'GLOBAL'
              ? 'bg-[#00f2ff11] border-l-2 border-[#00f2ff] text-[#00f2ff] shadow-[0_0_10px_#00f2ff22]'
              : 'border-[#00f2ff18] bg-[#11112288] text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-[#00f2ff]" />
          <span>NASA & SPACEX ({missions.length - isroMissions.length})</span>
        </button>

        <button
          onClick={() => {
            if (soundEffects) playSound('click');
            setActiveTab('ASTRONOMY');
          }}
          className={`px-4 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
            activeTab === 'ASTRONOMY'
              ? 'bg-[#00f2ff11] border-l-2 border-[#00f2ff] text-[#00f2ff] shadow-[0_0_10px_#00f2ff22]'
              : 'border-[#00f2ff18] bg-[#11112288] text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#7000ff]" />
          <span>CELESTIAL EVENTS ({astronomyEvents.length})</span>
        </button>
      </div>

      {activeTab !== 'ASTRONOMY' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mission List */}
          <div className="space-y-2 lg:col-span-1">
            <span className="text-[9px] uppercase text-[#00f2ff] opacity-80 tracking-wider block mb-1">
              MISSION TELEMETRY ARCHIVE
            </span>
            {(activeTab === 'ISRO' ? isroMissions : missions).map((m) => {
              const isSelected = selectedMission?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (soundEffects) playSound('click');
                    setSelectedMission(m);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition space-y-1 cursor-pointer ${
                    isSelected
                      ? 'bg-[#00f2ff11] border-[#00f2ff] text-white shadow-[0_0_15px_#00f2ff22]'
                      : 'border-[#00f2ff18] bg-[#111122aa] text-slate-300 hover:border-[#00f2ff44] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-[#00f2ff]">
                      {m.name}
                    </span>
                    <span className="text-[8px] px-1.5 py-0.2 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff]">
                      {m.agency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{m.vehicle}</span>
                    <span className="text-white font-semibold">{m.status}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Mission Detailed Dossier */}
          {selectedMission && (
            <div className="lg:col-span-2 p-5 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#00f2ff22] pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold font-display text-white">
                      {selectedMission.name}
                    </h2>
                    <span className="text-[9px] px-2 py-0.5 rounded border border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff] font-bold">
                      {selectedMission.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedMission.agency} • {selectedMission.type}
                  </p>
                </div>

                <button
                  onClick={() =>
                    onAskSpace(
                      `A.E.T.H.E.R., give a deep technical breakdown of the ${selectedMission.name} mission, including flight profile and payload specifications.`
                    )
                  }
                  className="px-3 py-1.5 rounded border border-[#00f2ff44] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-[0_0_8px_#00f2ff18]"
                >
                  <Radio className="w-3 h-3 text-[#00f2ff]" />
                  <span>ASK A.E.T.H.E.R. DOSSIER</span>
                </button>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded bg-[#111122] border border-[#00f2ff18] space-y-1">
                  <span className="text-slate-500 text-[10px] block uppercase">LAUNCH VEHICLE</span>
                  <span className="text-[#00f2ff] font-bold">{selectedMission.vehicle}</span>
                </div>
                <div className="p-2.5 rounded bg-[#111122] border border-[#00f2ff18] space-y-1">
                  <span className="text-slate-500 text-[10px] block uppercase">LAUNCH SITE</span>
                  <span className="text-white font-medium truncate block">{selectedMission.launchSite}</span>
                </div>
                <div className="p-2.5 rounded bg-[#111122] border border-[#00f2ff18] space-y-1">
                  <span className="text-slate-500 text-[10px] block uppercase">TARGET TIMELINE</span>
                  <span className="text-[#00f2ff] font-bold">{selectedMission.targetDate}</span>
                </div>
              </div>

              {/* Objective */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase text-[#00f2ff] opacity-80 tracking-wider">
                  MISSION OBJECTIVE:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed bg-[#111122] p-3 rounded-lg border border-[#00f2ff18]">
                  {selectedMission.objective}
                </p>
              </div>

              {/* Highlights */}
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase text-[#00f2ff] opacity-80 tracking-wider">
                  KEY MILESTONES & HIGHLIGHTS:
                </span>
                <div className="space-y-1">
                  {selectedMission.highlights.map((hl, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-slate-300 p-1.5 rounded bg-[#11112288] border border-[#00f2ff11]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Telemetry Snapshot */}
              {selectedMission.telemetry && (
                <div className="pt-2 border-t border-[#00f2ff18]">
                  <span className="text-[9px] uppercase text-[#00f2ff] opacity-80 block mb-1">
                    ORBITAL TELEMETRY PARAMETERS:
                  </span>
                  <pre className="p-2.5 rounded bg-[#050508] text-xs text-[#00f2ff] overflow-x-auto border border-[#00f2ff22]">
                    {JSON.stringify(selectedMission.telemetry, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Celestial Astronomy Events */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {astronomyEvents.map((evt, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#00f2ff]">
                  <span>{evt.date}</span>
                  <span className="text-[#7000ff] font-bold">ASTRONOMICAL EVENT</span>
                </div>
                <h3 className="text-sm font-bold text-white font-display">{evt.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{evt.description}</p>
              </div>
              <div className="pt-2 border-t border-[#00f2ff18] text-[10px] text-[#00f2ff]">
                VISIBILITY: {evt.visibility}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
