import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Sparkles,
  Filter,
  Sliders,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Tag,
  Trash2,
  Edit3,
  X,
  Play,
  Pause,
  ArrowUpDown,
  Flame,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { MissionObjective, ObjectivePriority, ObjectiveStatus, ProjectItem } from '../types';
import { playSound } from '../utils/audio';

interface MissionControlViewProps {
  onAskProject: (prompt: string) => void;
  soundEffects: boolean;
  projects?: ProjectItem[];
}

export const MissionControlView: React.FC<MissionControlViewProps> = ({
  onAskProject,
  soundEffects,
  projects = [],
}) => {
  const [objectives, setObjectives] = useState<MissionObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DEADLINE' | 'PROGRESS_ASC' | 'PROGRESS_DESC' | 'PRIORITY'>('DEADLINE');
  
  // Real-time clock for T-minus countdowns
  const [now, setNow] = useState<number>(Date.now());

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingObjective, setEditingObjective] = useState<MissionObjective | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formPriority, setFormPriority] = useState<ObjectivePriority>('HIGH_PRIORITY');
  const [formStatus, setFormStatus] = useState<ObjectiveStatus>('IN_FLIGHT');
  const [formProgress, setFormProgress] = useState(50);
  const [formDeadline, setFormDeadline] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formMilestones, setFormMilestones] = useState<string[]>(['']);

  // Inline milestone adder per card
  const [newMilestoneTitles, setNewMilestoneTitles] = useState<{ [objId: string]: string }>({});

  const fetchObjectives = async () => {
    try {
      const res = await fetch('/api/objectives');
      const data = await res.json();
      if (data.objectives) {
        setObjectives(data.objectives);
      }
    } catch (err) {
      console.warn('Backend objectives fetch failed, reading from localStorage cache', err);
      const cached = localStorage.getItem('aether_mission_objectives');
      if (cached) {
        try {
          setObjectives(JSON.parse(cached));
        } catch (e) {
          console.error(e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjectives();
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync to local cache whenever objectives change
  useEffect(() => {
    if (objectives.length > 0) {
      localStorage.setItem('aether_mission_objectives', JSON.stringify(objectives));
    }
  }, [objectives]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    if (soundEffects) playSound('click');
    setEditingObjective(null);
    setFormTitle('');
    setFormDesc('');
    setFormProjectId(projects[0]?.id || '');
    setFormPriority('HIGH_PRIORITY');
    setFormStatus('IN_FLIGHT');
    setFormProgress(25);
    // default deadline: 3 days from now
    const d = new Date(Date.now() + 72 * 3600 * 1000);
    setFormDeadline(d.toISOString().slice(0, 16));
    setFormTags('AEROSPACE, KERNEL');
    setFormMilestones(['Initial architecture definition', 'Unit validation']);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (obj: MissionObjective) => {
    if (soundEffects) playSound('click');
    setEditingObjective(obj);
    setFormTitle(obj.title);
    setFormDesc(obj.description);
    setFormProjectId(obj.projectId || '');
    setFormPriority(obj.priority);
    setFormStatus(obj.status);
    setFormProgress(obj.progress);
    try {
      setFormDeadline(new Date(obj.targetDeadline).toISOString().slice(0, 16));
    } catch (e) {
      setFormDeadline(new Date().toISOString().slice(0, 16));
    }
    setFormTags(obj.tags.join(', '));
    setFormMilestones(obj.milestones.length > 0 ? obj.milestones.map((m) => m.title) : ['']);
    setShowModal(true);
  };

  // Save Modal (Create or Update)
  const handleSaveObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (soundEffects) playSound('chime');

    const selectedProj = projects.find((p) => p.id === formProjectId);
    const deadlineIso = formDeadline ? new Date(formDeadline).toISOString() : new Date(Date.now() + 72 * 3600 * 1000).toISOString();
    const tagList = formTags.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean);
    const milestoneItems = formMilestones
      .map((m) => m.trim())
      .filter(Boolean)
      .map((title, idx) => {
        // preserve done state if editing
        if (editingObjective && editingObjective.milestones[idx]) {
          return { id: editingObjective.milestones[idx].id, title, done: editingObjective.milestones[idx].done };
        }
        return { id: `m-${Date.now()}-${idx}`, title, done: false };
      });

    if (editingObjective) {
      // Update
      try {
        const res = await fetch(`/api/objectives/${editingObjective.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDesc.trim(),
            projectId: formProjectId || undefined,
            projectName: selectedProj?.name,
            priority: formPriority,
            status: formStatus,
            progress: formProgress,
            targetDeadline: deadlineIso,
            tags: tagList,
          }),
        });
        const data = await res.json();
        if (data.success) {
          fetchObjectives();
          setShowModal(false);
        }
      } catch (err) {
        console.error('Update objective error:', err);
        // Fallback local update
        setObjectives((prev) =>
          prev.map((o) =>
            o.id === editingObjective.id
              ? {
                  ...o,
                  title: formTitle.trim(),
                  description: formDesc.trim(),
                  projectId: formProjectId || undefined,
                  projectName: selectedProj?.name,
                  priority: formPriority,
                  status: formStatus,
                  progress: formProgress,
                  targetDeadline: deadlineIso,
                  tags: tagList,
                  updatedAt: new Date().toISOString(),
                }
              : o
          )
        );
        setShowModal(false);
      }
    } else {
      // Create
      try {
        const res = await fetch('/api/objectives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDesc.trim(),
            projectId: formProjectId || undefined,
            projectName: selectedProj?.name,
            priority: formPriority,
            status: formStatus,
            progress: formProgress,
            targetDeadline: deadlineIso,
            milestones: milestoneItems,
            tags: tagList,
          }),
        });
        const data = await res.json();
        if (data.success) {
          fetchObjectives();
          setShowModal(false);
        }
      } catch (err) {
        console.error('Create objective error:', err);
        const newObj: MissionObjective = {
          id: 'obj-' + Date.now(),
          title: formTitle.trim(),
          description: formDesc.trim(),
          projectId: formProjectId || undefined,
          projectName: selectedProj?.name,
          priority: formPriority,
          status: formStatus,
          progress: formProgress,
          targetDeadline: deadlineIso,
          assignedTo: 'Nishant (Root Operator)',
          milestones: milestoneItems,
          tags: tagList,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setObjectives((prev) => [newObj, ...prev]);
        setShowModal(false);
      }
    }
  };

  // Delete Objective
  const handleDeleteObjective = async (id: string) => {
    if (soundEffects) playSound('click');
    if (!window.confirm('Abort and purge this Mission Control objective?')) return;

    try {
      const res = await fetch(`/api/objectives/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchObjectives();
      }
    } catch (err) {
      setObjectives((prev) => prev.filter((o) => o.id !== id));
    }
  };

  // Toggle Milestone
  const handleToggleMilestone = async (objectiveId: string, milestoneId: string) => {
    if (soundEffects) playSound('click');
    try {
      const res = await fetch(`/api/objectives/${objectiveId}/milestone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggleMilestoneId: milestoneId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchObjectives();
      }
    } catch (err) {
      setObjectives((prev) =>
        prev.map((o) => {
          if (o.id !== objectiveId) return o;
          const updatedMilestones = o.milestones.map((m) => (m.id === milestoneId ? { ...m, done: !m.done } : m));
          const doneCount = updatedMilestones.filter((m) => m.done).length;
          const progress = updatedMilestones.length > 0 ? Math.round((doneCount / updatedMilestones.length) * 100) : o.progress;
          return {
            ...o,
            milestones: updatedMilestones,
            progress,
            status: progress === 100 ? 'COMPLETED' : o.status === 'COMPLETED' ? 'IN_FLIGHT' : o.status,
          };
        })
      );
    }
  };

  // Add Milestone to Card
  const handleAddMilestoneToCard = async (objectiveId: string) => {
    const title = newMilestoneTitles[objectiveId]?.trim();
    if (!title) return;
    if (soundEffects) playSound('click');

    try {
      const res = await fetch(`/api/objectives/${objectiveId}/milestone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneTitle: title }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMilestoneTitles((prev) => ({ ...prev, [objectiveId]: '' }));
        fetchObjectives();
      }
    } catch (err) {
      setObjectives((prev) =>
        prev.map((o) => {
          if (o.id !== objectiveId) return o;
          const updatedMilestones = [...o.milestones, { id: 'm-' + Date.now(), title, done: false }];
          const doneCount = updatedMilestones.filter((m) => m.done).length;
          const progress = Math.round((doneCount / updatedMilestones.length) * 100);
          return { ...o, milestones: updatedMilestones, progress };
        })
      );
      setNewMilestoneTitles((prev) => ({ ...prev, [objectiveId]: '' }));
    }
  };

  // Adjust Progress directly
  const handleAdjustProgress = async (objectiveId: string, deltaOrExact: { delta?: number; exact?: number }) => {
    if (soundEffects) playSound('click');
    try {
      const res = await fetch(`/api/objectives/${objectiveId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deltaOrExact),
      });
      const data = await res.json();
      if (data.success) {
        fetchObjectives();
      }
    } catch (err) {
      setObjectives((prev) =>
        prev.map((o) => {
          if (o.id !== objectiveId) return o;
          let newP = o.progress;
          if (deltaOrExact.exact !== undefined) newP = deltaOrExact.exact;
          else if (deltaOrExact.delta !== undefined) newP = o.progress + deltaOrExact.delta;
          newP = Math.min(100, Math.max(0, newP));
          return {
            ...o,
            progress: newP,
            status: newP === 100 ? 'COMPLETED' : o.status === 'COMPLETED' ? 'IN_FLIGHT' : o.status,
          };
        })
      );
    }
  };

  // Quick Status Switch
  const handleQuickStatusChange = async (objectiveId: string, newStatus: ObjectiveStatus) => {
    if (soundEffects) playSound('click');
    try {
      const res = await fetch(`/api/objectives/${objectiveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) fetchObjectives();
    } catch (err) {
      setObjectives((prev) => prev.map((o) => (o.id === objectiveId ? { ...o, status: newStatus } : o)));
    }
  };

  // Countdown Helper
  const formatCountdown = (targetDateStr: string) => {
    const target = new Date(targetDateStr).getTime();
    const diff = target - now;

    if (isNaN(target)) return { label: 'TBD', isUrgent: false, isOverdue: false };

    if (diff <= 0) {
      const overdueMs = Math.abs(diff);
      const days = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((overdueMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return {
        label: `OVERDUE +${days > 0 ? `${days}d ` : ''}${hours}h`,
        isUrgent: true,
        isOverdue: true,
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const isUrgent = diff < 48 * 3600 * 1000; // less than 48 hours

    if (days > 0) {
      return {
        label: `T-MINUS ${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`,
        isUrgent,
        isOverdue: false,
      };
    }
    return {
      label: `T-MINUS ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`,
      isUrgent: true,
      isOverdue: false,
    };
  };

  // Priority metadata
  const getPriorityBadge = (p: ObjectivePriority) => {
    switch (p) {
      case 'CRITICAL_T0':
        return {
          label: 'CRITICAL T-0',
          bg: 'bg-rose-950/60 border-rose-500/80 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
          icon: <Flame className="w-3 h-3 text-rose-400 animate-pulse" />,
        };
      case 'HIGH_PRIORITY':
        return {
          label: 'HIGH PRIORITY',
          bg: 'bg-amber-950/60 border-amber-500/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
          icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
        };
      case 'NOMINAL':
        return {
          label: 'NOMINAL',
          bg: 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(0,242,255,0.2)]',
          icon: <Target className="w-3 h-3 text-cyan-400" />,
        };
      case 'TACTICAL':
      default:
        return {
          label: 'TACTICAL',
          bg: 'bg-purple-950/60 border-purple-500/60 text-purple-300',
          icon: <Zap className="w-3 h-3 text-purple-400" />,
        };
    }
  };

  // Status metadata
  const getStatusBadge = (s: ObjectiveStatus) => {
    switch (s) {
      case 'IN_FLIGHT':
        return 'border-[#00f2ff] bg-[#00f2ff18] text-[#00f2ff] shadow-[0_0_8px_#00f2ff33]';
      case 'COMPLETED':
        return 'border-emerald-500/80 bg-emerald-950/60 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
      case 'BLOCKED':
        return 'border-red-500/80 bg-red-950/60 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]';
      case 'ABORTED':
        return 'border-slate-600 bg-slate-900/60 text-slate-400';
      case 'NOT_STARTED':
      default:
        return 'border-slate-500/50 bg-slate-900/50 text-slate-300';
    }
  };

  // Filtered & Sorted Objectives
  const filteredObjectives = useMemo(() => {
    return objectives
      .filter((o) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = o.title.toLowerCase().includes(q);
          const matchesDesc = o.description.toLowerCase().includes(q);
          const matchesProject = o.projectName?.toLowerCase().includes(q);
          const matchesTags = o.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchesTitle && !matchesDesc && !matchesProject && !matchesTags) return false;
        }

        // Status Filter
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'IN_FLIGHT' && o.status !== 'IN_FLIGHT') return false;
          if (statusFilter === 'COMPLETED' && o.status !== 'COMPLETED') return false;
          if (statusFilter === 'NOT_STARTED' && o.status !== 'NOT_STARTED') return false;
          if (statusFilter === 'BLOCKED' && o.status !== 'BLOCKED') return false;
          if (statusFilter === 'IMMINENT') {
            const diff = new Date(o.targetDeadline).getTime() - now;
            if (diff > 48 * 3600 * 1000 || o.status === 'COMPLETED') return false;
          }
        }

        // Priority Filter
        if (priorityFilter !== 'ALL' && o.priority !== priorityFilter) return false;

        // Project Filter
        if (projectFilter !== 'ALL' && o.projectId !== projectFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'DEADLINE') {
          return new Date(a.targetDeadline).getTime() - new Date(b.targetDeadline).getTime();
        }
        if (sortBy === 'PROGRESS_ASC') {
          return a.progress - b.progress;
        }
        if (sortBy === 'PROGRESS_DESC') {
          return b.progress - a.progress;
        }
        if (sortBy === 'PRIORITY') {
          const pOrder: { [k in ObjectivePriority]: number } = {
            CRITICAL_T0: 0,
            HIGH_PRIORITY: 1,
            NOMINAL: 2,
            TACTICAL: 3,
          };
          return pOrder[a.priority] - pOrder[b.priority];
        }
        return 0;
      });
  }, [objectives, searchQuery, statusFilter, priorityFilter, projectFilter, sortBy, now]);

  // Overall Mission Readiness Index
  const missionReadinessIndex = useMemo(() => {
    if (objectives.length === 0) return 0;
    const total = objectives.reduce((acc, o) => acc + o.progress, 0);
    return Math.round(total / objectives.length);
  }, [objectives]);

  // Statistics
  const inFlightCount = objectives.filter((o) => o.status === 'IN_FLIGHT').length;
  const criticalCount = objectives.filter((o) => o.priority === 'CRITICAL_T0' && o.status !== 'COMPLETED').length;
  const completedCount = objectives.filter((o) => o.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 font-mono">
      {/* Tactical Top Banner */}
      <div className="p-4 sm:p-5 rounded-xl border border-[#00f2ff33] bg-[#050508ee] backdrop-blur-xl shadow-[0_0_30px_rgba(0,242,255,0.12)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg border border-[#00f2ff] bg-[#00f2ff18] text-[#00f2ff] shadow-[0_0_15px_#00f2ff33] shrink-0 mt-0.5">
              <Target className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold font-display text-white tracking-widest uppercase">
                  MISSION CONTROL // SPRINT & OBJECTIVE MATRIX
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded border border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff] font-bold">
                  AUTONOMOUS SCHEDULER
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-3xl">
                Time-sensitive engineering milestones, dynamic countdown clocks, stage completion tracking, and real-time mission readiness telemetry for Nishant.
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() =>
                onAskProject(
                  'A.E.T.H.E.R., perform a comprehensive Mission Control triage of all active time-sensitive objectives for Nishant. Identify immediate critical path bottlenecks, calculate probability of milestone completion, and output an optimal execution schedule.'
                )
              }
              className="px-3.5 py-2 rounded-lg border border-[#00f2ff44] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-[0_0_12px_#00f2ff18]"
            >
              <Sparkles className="w-4 h-4 text-[#00f2ff]" />
              <span>AI SPRINT TRIAGE</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-lg bg-[#00f2ff] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_#00f2ff66]"
            >
              <Plus className="w-4 h-4" />
              <span>NEW OBJECTIVE</span>
            </button>
          </div>
        </div>

        {/* HUD Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#00f2ff18]">
          <div className="p-3 rounded-lg border border-[#00f2ff22] bg-[#11112288] space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
              <span>READINESS INDEX</span>
              <TrendingUp className="w-3 h-3 text-[#00f2ff]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-display text-white">{missionReadinessIndex}%</span>
              <span className="text-[10px] text-[#00f2ff]">NOMINAL</span>
            </div>
            <div className="w-full h-1 bg-[#050508] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00f2ff] to-emerald-400 shadow-[0_0_8px_#00f2ff]"
                style={{ width: `${missionReadinessIndex}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[#00f2ff22] bg-[#11112288] space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
              <span>IN-FLIGHT ACTIVE</span>
              <Play className="w-3 h-3 text-[#00f2ff]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-display text-[#00f2ff]">{inFlightCount}</span>
              <span className="text-[10px] text-slate-400">/ {objectives.length} TOTAL</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {objectives.length - inFlightCount - completedCount} pending / queued
            </div>
          </div>

          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-950/20 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-rose-300 uppercase">
              <span>CRITICAL T-0</span>
              <Flame className="w-3 h-3 text-rose-400 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-display text-rose-400">{criticalCount}</span>
              <span className="text-[10px] text-rose-300">PRIORITY</span>
            </div>
            <div className="text-[10px] text-rose-300/80 truncate">Immediate sprint focus</div>
          </div>

          <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-emerald-300 uppercase">
              <span>COMPLETED</span>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-display text-emerald-400">{completedCount}</span>
              <span className="text-[10px] text-emerald-300">OBJECTIVES</span>
            </div>
            <div className="text-[10px] text-emerald-300/80 truncate">
              {objectives.length > 0 ? Math.round((completedCount / objectives.length) * 100) : 0}% success rate
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-3 sm:p-4 rounded-xl border border-[#00f2ff18] bg-[#050508bb] backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search objectives by title, tag, or project..."
            className="w-full bg-[#111122] border border-[#00f2ff33] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-[#00f2ff44] focus:outline-none focus:border-[#00f2ff]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              if (soundEffects) playSound('click');
              setStatusFilter(e.target.value);
            }}
            className="bg-[#111122] border border-[#00f2ff33] rounded-lg px-2.5 py-1.5 text-[#00f2ff] focus:outline-none focus:border-[#00f2ff] text-xs cursor-pointer"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="IN_FLIGHT">IN FLIGHT</option>
            <option value="IMMINENT">IMMINENT (&lt; 48H)</option>
            <option value="NOT_STARTED">NOT STARTED</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              if (soundEffects) playSound('click');
              setPriorityFilter(e.target.value);
            }}
            className="bg-[#111122] border border-[#00f2ff33] rounded-lg px-2.5 py-1.5 text-[#00f2ff] focus:outline-none focus:border-[#00f2ff] text-xs cursor-pointer"
          >
            <option value="ALL">ALL PRIORITIES</option>
            <option value="CRITICAL_T0">CRITICAL T-0</option>
            <option value="HIGH_PRIORITY">HIGH PRIORITY</option>
            <option value="NOMINAL">NOMINAL</option>
            <option value="TACTICAL">TACTICAL</option>
          </select>

          {/* Project filter */}
          {projects.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => {
                if (soundEffects) playSound('click');
                setProjectFilter(e.target.value);
              }}
              className="bg-[#111122] border border-[#00f2ff33] rounded-lg px-2.5 py-1.5 text-[#00f2ff] focus:outline-none focus:border-[#00f2ff] text-xs cursor-pointer"
            >
              <option value="ALL">ALL PROJECTS</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => {
              if (soundEffects) playSound('click');
              setSortBy(e.target.value as any);
            }}
            className="bg-[#111122] border border-[#00f2ff33] rounded-lg px-2.5 py-1.5 text-[#00f2ff] focus:outline-none focus:border-[#00f2ff] text-xs cursor-pointer"
          >
            <option value="DEADLINE">SORT: URGENCY (DEADLINE)</option>
            <option value="PRIORITY">SORT: PRIORITY</option>
            <option value="PROGRESS_DESC">SORT: PROGRESS (HIGH TO LOW)</option>
            <option value="PROGRESS_ASC">SORT: PROGRESS (LOW TO HIGH)</option>
          </select>
        </div>
      </div>

      {/* Objectives Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <div className="w-6 h-6 border-2 border-[#00f2ff] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Synchronizing Mission Objectives...</p>
        </div>
      ) : filteredObjectives.length === 0 ? (
        <div className="p-12 rounded-xl border border-[#00f2ff22] bg-[#05050888] text-center space-y-3">
          <Target className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">NO MATCHING MISSION OBJECTIVES FOUND</p>
          <p className="text-xs text-slate-500">Adjust your filter parameters or initialize a new mission objective.</p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded bg-[#00f2ff18] border border-[#00f2ff] text-[#00f2ff] text-xs font-bold hover:bg-[#00f2ff33] transition cursor-pointer"
          >
            + INITIALIZE OBJECTIVE
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredObjectives.map((obj) => {
            const priorityInfo = getPriorityBadge(obj.priority);
            const countdownInfo = formatCountdown(obj.targetDeadline);
            const statusClass = getStatusBadge(obj.status);
            const isFinished = obj.status === 'COMPLETED';

            return (
              <div
                key={obj.id}
                className={`p-4 sm:p-5 rounded-xl border transition space-y-4 relative overflow-hidden backdrop-blur-md ${
                  isFinished
                    ? 'border-emerald-500/30 bg-[#050508aa]'
                    : countdownInfo.isOverdue
                    ? 'border-rose-500/50 bg-[#120508aa] shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                    : countdownInfo.isUrgent
                    ? 'border-amber-500/50 bg-[#120a05aa] shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                    : 'border-[#00f2ff22] bg-[#050508dd] hover:border-[#00f2ff55]'
                }`}
              >
                {/* Top Status & Countdown Row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Priority Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${priorityInfo.bg}`}
                    >
                      {priorityInfo.icon}
                      <span>{priorityInfo.label}</span>
                    </span>

                    {/* Associated Project Tag */}
                    {obj.projectName && (
                      <span className="text-[10px] px-2 py-0.5 rounded border border-[#00f2ff33] bg-[#111122] text-slate-300 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5 text-[#00f2ff]" />
                        <span className="truncate max-w-[140px]">{obj.projectName}</span>
                      </span>
                    )}
                  </div>

                  {/* Countdown Badge */}
                  <div
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      isFinished
                        ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                        : countdownInfo.isOverdue
                        ? 'border-rose-500 bg-rose-950/80 text-rose-300 animate-pulse'
                        : countdownInfo.isUrgent
                        ? 'border-amber-500 bg-amber-950/80 text-amber-300'
                        : 'border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isFinished ? 'ACCOMPLISHED' : countdownInfo.label}</span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-1">
                  <h3
                    className={`text-sm sm:text-base font-bold font-display tracking-wider ${
                      isFinished ? 'text-slate-400 line-through' : 'text-white'
                    }`}
                  >
                    {obj.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{obj.description}</p>
                </div>

                {/* Progress Bar & Numeric Controller */}
                <div className="space-y-2 p-3 rounded-lg bg-[#11112288] border border-[#00f2ff18]">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase text-[#00f2ff] font-bold">PROGRESS:</span>
                      <span className="text-sm font-bold text-white">{obj.progress}%</span>
                    </div>

                    {/* Quick Step Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAdjustProgress(obj.id, { delta: -10 })}
                        disabled={obj.progress <= 0}
                        className="px-1.5 py-0.5 rounded border border-[#00f2ff22] hover:bg-[#00f2ff18] text-slate-300 hover:text-white text-[10px] disabled:opacity-30 cursor-pointer"
                      >
                        -10%
                      </button>
                      <button
                        onClick={() => handleAdjustProgress(obj.id, { delta: 10 })}
                        disabled={obj.progress >= 100}
                        className="px-1.5 py-0.5 rounded border border-[#00f2ff22] hover:bg-[#00f2ff18] text-slate-300 hover:text-white text-[10px] disabled:opacity-30 cursor-pointer"
                      >
                        +10%
                      </button>
                      <button
                        onClick={() => handleAdjustProgress(obj.id, { exact: 100 })}
                        className="px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-[10px] font-bold cursor-pointer"
                      >
                        100%
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-[#050508] rounded-full overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFinished
                          ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                          : obj.progress > 75
                          ? 'bg-gradient-to-r from-[#00f2ff] to-emerald-400 shadow-[0_0_8px_#00f2ff]'
                          : 'bg-gradient-to-r from-purple-500 to-[#00f2ff] shadow-[0_0_8px_#00f2ff]'
                      }`}
                      style={{ width: `${obj.progress}%` }}
                    />
                  </div>

                  {/* Slider Control */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={obj.progress}
                    onChange={(e) => handleAdjustProgress(obj.id, { exact: Number(e.target.value) })}
                    className="w-full accent-[#00f2ff] h-1 bg-transparent cursor-pointer opacity-60 hover:opacity-100 transition"
                  />
                </div>

                {/* Milestone Sub-tasks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
                    <span className="text-[#00f2ff] font-bold">
                      STAGE MILESTONES ({obj.milestones.filter((m) => m.done).length} / {obj.milestones.length})
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {obj.milestones.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleToggleMilestone(obj.id, m.id)}
                        className={`p-2 rounded border cursor-pointer transition flex items-center justify-between text-xs ${
                          m.done
                            ? 'bg-[#050508] border-emerald-500/20 text-slate-500 line-through'
                            : 'bg-[#11112288] border-[#00f2ff18] text-slate-200 hover:border-[#00f2ff] hover:bg-[#00f2ff11]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {m.done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-[#00f2ff] shrink-0" />
                          )}
                          <span className="truncate">{m.title}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 shrink-0 ml-2">{m.done ? 'DONE' : 'PENDING'}</span>
                      </div>
                    ))}
                  </div>

                  {/* Inline Add Milestone */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newMilestoneTitles[obj.id] || ''}
                      onChange={(e) =>
                        setNewMilestoneTitles((prev) => ({ ...prev, [obj.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMilestoneToCard(obj.id)}
                      placeholder="+ Add stage milestone..."
                      className="flex-1 bg-[#111122] border border-[#00f2ff22] rounded px-2.5 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00f2ff]"
                    />
                    <button
                      onClick={() => handleAddMilestoneToCard(obj.id)}
                      disabled={!newMilestoneTitles[obj.id]?.trim()}
                      className="px-2.5 py-1 rounded border border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff] text-[10px] font-bold hover:bg-[#00f2ff22] transition disabled:opacity-30 cursor-pointer"
                    >
                      ADD
                    </button>
                  </div>
                </div>

                {/* Tags & Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-[#00f2ff18] gap-2 flex-wrap">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {obj.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.5 rounded border border-[#00f2ff22] bg-[#111122] text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Card Controls */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* Status Dropdown */}
                    <select
                      value={obj.status}
                      onChange={(e) => handleQuickStatusChange(obj.id, e.target.value as ObjectiveStatus)}
                      className={`text-[10px] font-bold px-2 py-1 rounded border ${statusClass} focus:outline-none cursor-pointer bg-transparent`}
                    >
                      <option value="IN_FLIGHT" className="bg-[#050508] text-[#00f2ff]">
                        IN FLIGHT
                      </option>
                      <option value="NOT_STARTED" className="bg-[#050508] text-slate-300">
                        NOT STARTED
                      </option>
                      <option value="BLOCKED" className="bg-[#050508] text-red-400">
                        BLOCKED
                      </option>
                      <option value="COMPLETED" className="bg-[#050508] text-emerald-400">
                        COMPLETED
                      </option>
                      <option value="ABORTED" className="bg-[#050508] text-slate-400">
                        ABORTED
                      </option>
                    </select>

                    {/* Ask AI about this objective */}
                    <button
                      onClick={() =>
                        onAskProject(
                          `A.E.T.H.E.R., analyze the Mission Control objective "${obj.title}". Current progress is ${obj.progress}%, target deadline is ${new Date(
                            obj.targetDeadline
                          ).toLocaleString()}. Suggest a step-by-step tactical execution roadmap to accelerate completion for Nishant.`
                        )
                      }
                      title="Analyze with A.E.T.H.E.R."
                      className="p-1.5 rounded border border-[#00f2ff44] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEditModal(obj)}
                      title="Edit Objective"
                      className="p-1.5 rounded border border-[#00f2ff22] hover:border-[#00f2ff] hover:bg-[#00f2ff11] text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteObjective(obj.id)}
                      title="Delete Objective"
                      className="p-1.5 rounded border border-rose-500/30 hover:border-rose-500 hover:bg-rose-950/40 text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Objective Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl p-5 sm:p-6 rounded-xl border border-[#00f2ff44] bg-[#050508ee] shadow-[0_0_40px_rgba(0,242,255,0.2)] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#00f2ff]" />
                <h3 className="text-sm sm:text-base font-bold text-white tracking-widest uppercase">
                  {editingObjective ? 'UPDATE MISSION OBJECTIVE' : 'INITIALIZE MISSION OBJECTIVE'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveObjective} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 text-[11px] font-bold text-[#00f2ff]">
                  OBJECTIVE TITLE:
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Implement S-band SAR Ground Footprint & Doppler Shift"
                  className="w-full bg-[#111122] border border-[#00f2ff33] rounded-lg p-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00f2ff]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-[11px] font-bold text-[#00f2ff]">
                  TACTICAL DESCRIPTION:
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Engineering scope, mathematical constraints, and target outcomes for Nishant..."
                  rows={2}
                  className="w-full bg-[#111122] border border-[#00f2ff33] rounded-lg p-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00f2ff]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Associated Project */}
                <div>
                  <label className="block text-slate-300 mb-1 text-[11px] font-bold text-[#00f2ff]">
                    ASSOCIATED PROJECT:
                  </label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full bg-[#111122] border border-[#00f2ff33] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00f2ff] cursor-pointer"
                  >
                    <option value="">Standalone / Unassigned</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-slate-300 mb-1 text-[11px] font-bold text-[#00f2ff]">
                    PRIORITY LEVEL:
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as ObjectivePriority)}
                    className="w-full bg-[#111122] border border-[#00f2ff33] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00f2ff] cursor-pointer"
                  >
                    <option value="CRITICAL_T0">CRITICAL T-0 (Highest Urgency)</option>
                    <option value="HIGH_PRIORITY">HIGH PRIORITY</option>
                    <option value="NOMINAL">NOMINAL</option>
                    <option value="TACTICAL">TACTICAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Target Deadline */}
                <div>
                  <label className="block text-slate-300 mb-1 text-[11px] font-bold text-[#00f2ff]">
                    TARGET DEADLINE (UTC/LOCAL):
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full bg-[#111122] border border-[#00f2ff33] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00f2ff]"
                  />
                </div>

                {/* Initial Status */}
                <div>
                  <label className="block text-slate-300 mb-1 text-[11px] font-bold text-[#00f2ff]">
                    MISSION STATUS:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ObjectiveStatus)}
                    className="w-full bg-[#111122] border border-[#00f2ff33] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#00f2ff] cursor-pointer"
                  >
                    <option value="IN_FLIGHT">IN FLIGHT</option>
                    <option value="NOT_STARTED">NOT STARTED</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ABORTED">ABORTED</option>
                  </select>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1.5 p-3 rounded-lg border border-[#00f2ff22] bg-[#111122]">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span className="font-bold text-[#00f2ff]">COMPLETION PROGRESS:</span>
                  <span className="font-bold text-white">{formProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formProgress}
                  onChange={(e) => setFormProgress(Number(e.target.value))}
                  className="w-full accent-[#00f2ff] cursor-pointer"
                />
              </div>

              {/* Milestones dynamic list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
                  <span className="text-[#00f2ff]">STAGE MILESTONES:</span>
                  <button
                    type="button"
                    onClick={() => setFormMilestones((prev) => [...prev, ''])}
                    className="text-[10px] text-[#00f2ff] hover:underline cursor-pointer"
                  >
                    + Add Milestone Field
                  </button>
                </div>
                {formMilestones.map((ms, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={ms}
                      onChange={(e) => {
                        const copy = [...formMilestones];
                        copy[idx] = e.target.value;
                        setFormMilestones(copy);
                      }}
                      placeholder={`Milestone stage #${idx + 1}`}
                      className="flex-1 bg-[#111122] border border-[#00f2ff33] rounded p-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00f2ff]"
                    />
                    {formMilestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFormMilestones((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-2 text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-slate-300 mb-1 text-[11px] font-bold text-[#00f2ff]">
                  TAGS (comma-separated):
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="AEROSPACE, RADAR, KERNEL, TELEMETRY"
                  className="w-full bg-[#111122] border border-[#00f2ff33] rounded-lg p-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00f2ff]"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#00f2ff22]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#00f2ff22] text-slate-400 hover:text-white cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#00f2ff] hover:bg-white text-black font-bold uppercase tracking-wider transition cursor-pointer shadow-[0_0_15px_#00f2ff66]"
                >
                  {editingObjective ? 'COMMIT CHANGES' : 'DEPLOY OBJECTIVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
