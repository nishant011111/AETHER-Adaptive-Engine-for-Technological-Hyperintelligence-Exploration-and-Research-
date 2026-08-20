import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Plus,
  CheckCircle2,
  Circle,
  ExternalLink,
  GitBranch,
  Layers,
  Sparkles,
  Terminal,
  Activity,
  Target,
  Clock,
} from 'lucide-react';
import { ProjectItem } from '../types';
import { playSound } from '../utils/audio';
import { MissionControlView } from './MissionControlView';

interface ProjectsViewProps {
  onAskProject: (prompt: string) => void;
  soundEffects: boolean;
  initialSubTab?: 'MISSION_CONTROL' | 'PROJECT_DOSSIERS';
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onAskProject,
  soundEffects,
  initialSubTab = 'MISSION_CONTROL',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'MISSION_CONTROL' | 'PROJECT_DOSSIERS'>(initialSubTab);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectTech, setNewProjectTech] = useState('');

  const fetchProjects = () => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) {
          setProjects(data.projects);
          if (!selectedProjectId && data.projects.length > 0) {
            setSelectedProjectId(data.projects[0].id);
          }
        }
      })
      .catch((err) => console.error('Projects fetch error:', err));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleToggleTask = async (projectId: string, taskId: string) => {
    if (soundEffects) playSound('click');
    try {
      const res = await fetch(`/api/projects/${projectId}/task`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggleTaskId: taskId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProjects();
      }
    } catch (err) {
      console.error('Task toggle error:', err);
    }
  };

  const handleAddTask = async (projectId: string) => {
    if (!newTaskTitle.trim()) return;
    if (soundEffects) playSound('click');
    try {
      const res = await fetch(`/api/projects/${projectId}/task`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: newTaskTitle.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTaskTitle('');
        fetchProjects();
      }
    } catch (err) {
      console.error('Add task error:', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    if (soundEffects) playSound('chime');
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim(),
          technologies: newProjectTech.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddProjectModal(false);
        setNewProjectName('');
        setNewProjectDesc('');
        setNewProjectTech('');
        fetchProjects();
        if (data.project) setSelectedProjectId(data.project.id);
      }
    } catch (err) {
      console.error('Create project error:', err);
    }
  };

  const selectedProj = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto font-mono">
      {/* Sub-view Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (soundEffects) playSound('click');
              setActiveSubTab('MISSION_CONTROL');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'MISSION_CONTROL'
                ? 'bg-[#00f2ff] text-black shadow-[0_0_15px_#00f2ff66]'
                : 'border border-[#00f2ff33] bg-[#11112288] text-[#00f2ff] hover:bg-[#00f2ff18]'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>MISSION CONTROL // OBJECTIVES</span>
          </button>

          <button
            onClick={() => {
              if (soundEffects) playSound('click');
              setActiveSubTab('PROJECT_DOSSIERS');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'PROJECT_DOSSIERS'
                ? 'bg-[#00f2ff] text-black shadow-[0_0_15px_#00f2ff66]'
                : 'border border-[#00f2ff33] bg-[#11112288] text-[#00f2ff] hover:bg-[#00f2ff18]'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>PROJECT DOSSIERS & ARCHITECTURE</span>
          </button>
        </div>

        {activeSubTab === 'PROJECT_DOSSIERS' && (
          <button
            onClick={() => {
              if (soundEffects) playSound('click');
              setShowAddProjectModal(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#00f2ff] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-[0_0_12px_#00f2ff44]"
          >
            <Plus className="w-4 h-4" />
            <span>NEW PROJECT</span>
          </button>
        )}
      </div>

      {/* Render Active Sub-View */}
      {activeSubTab === 'MISSION_CONTROL' ? (
        <MissionControlView
          onAskProject={onAskProject}
          soundEffects={soundEffects}
          projects={projects}
        />
      ) : (
        <div className="space-y-6">
          {/* Top Banner for Project Hub */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg border border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff] shadow-[0_0_15px_#00f2ff22]">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold font-display text-white tracking-widest uppercase">
                  NISHANT'S PROJECT HUB & ARCHITECTURE MATRIX
                </h1>
                <p className="text-xs text-slate-400">
                  Active software systems, task milestones, roadmap tracking, and GitHub repository integration.
                </p>
              </div>
            </div>
          </div>

          {/* Project Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {projects.map((proj) => {
              const isSelected = selectedProj?.id === proj.id;
              return (
                <button
                  key={proj.id}
                  onClick={() => {
                    if (soundEffects) playSound('click');
                    setSelectedProjectId(proj.id);
                  }}
                  className={`p-4 rounded-xl border text-left transition space-y-2 relative overflow-hidden cursor-pointer ${
                    isSelected
                      ? 'bg-[#00f2ff11] border-[#00f2ff] text-white shadow-[0_0_18px_#00f2ff22]'
                      : 'border-[#00f2ff18] bg-[#11112288] text-slate-300 hover:border-[#00f2ff44]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold tracking-wider text-[#00f2ff]">
                      {proj.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded border border-[#00f2ff33] bg-[#00f2ff11] text-[#00f2ff]">
                      {proj.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{proj.description}</p>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span className="opacity-70">PROGRESS</span>
                      <span className="text-[#00f2ff] font-bold">{proj.progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#111122] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00f2ff] shadow-[0_0_5px_#00f2ff]"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Project Detailed Matrix */}
          {selectedProj && (
            <div className="p-5 rounded-xl border border-[#00f2ff22] bg-[#050508bb] backdrop-blur-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#00f2ff22] pb-3 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold font-display text-white">
                      {selectedProj.name}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 font-bold">
                      {selectedProj.progress}% COMPLETE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedProj.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onAskProject(
                        `A.E.T.H.E.R., audit the roadmap and architecture for project ${selectedProj.name}, and generate next sprint milestones for Nishant.`
                      )
                    }
                    className="px-3 py-1.5 rounded border border-[#00f2ff44] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_8px_#00f2ff18]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#00f2ff]" />
                    <span>AI ARCHITECTURE AUDIT</span>
                  </button>
                </div>
              </div>

              {/* Tech Stack Pills */}
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase text-[#00f2ff] opacity-80 tracking-wider">
                  TECHNOLOGY STACK & RUNTIMES:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProj.technologies.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded border border-[#00f2ff33] bg-[#111122] text-white"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tasks & Milestones */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase text-[#00f2ff] opacity-80 tracking-wider">
                    SPRINT MILESTONES & TASKS ({selectedProj.tasks.filter((t) => t.done).length} / {selectedProj.tasks.length})
                  </span>
                </div>

                <div className="space-y-1.5">
                  {selectedProj.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(selectedProj.id, task.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition flex items-center justify-between text-xs ${
                        task.done
                          ? 'bg-[#050508] border-[#00f2ff11] text-slate-500 line-through'
                          : 'bg-[#111122aa] border-[#00f2ff22] text-slate-200 hover:border-[#00f2ff] hover:bg-[#00f2ff11]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {task.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#00f2ff] shrink-0" />
                        )}
                        <span>{task.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{task.done ? 'COMPLETED' : 'PENDING'}</span>
                    </div>
                  ))}
                </div>

                {/* Add Task Input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(selectedProj.id)}
                    placeholder="Add new task or milestone to this project..."
                    className="flex-1 bg-[#111122] border border-[#00f2ff33] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-[#00f2ff44] focus:outline-none focus:border-[#00f2ff]"
                  />
                  <button
                    onClick={() => handleAddTask(selectedProj.id)}
                    disabled={!newTaskTitle.trim()}
                    className="px-3.5 py-1.5 rounded border border-[#00f2ff44] bg-[#00f2ff11] text-[#00f2ff] hover:bg-[#00f2ff22] text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                  >
                    ADD TASK
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-5 rounded-xl border border-[#00f2ff33] bg-[#050508ee] shadow-[0_0_30px_#00f2ff22] space-y-4">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase">
              CREATE NEW PROJECT DOSSIER
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">PROJECT NAME:</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Autonomous Mars Rover Sim"
                  className="w-full bg-[#111122] border border-[#00f2ff33] rounded p-2 text-white placeholder:text-[#00f2ff44] focus:outline-none focus:border-[#00f2ff]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">DESCRIPTION:</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="High-level architectural purpose for Nishant..."
                  rows={2}
                  className="w-full bg-[#111122] border border-[#00f2ff33] rounded p-2 text-white placeholder:text-[#00f2ff44] focus:outline-none focus:border-[#00f2ff]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">TECHNOLOGIES (comma-separated):</label>
                <input
                  type="text"
                  value={newProjectTech}
                  onChange={(e) => setNewProjectTech(e.target.value)}
                  placeholder="React, TypeScript, PyTorch, ROS2"
                  className="w-full bg-[#111122] border border-[#00f2ff33] rounded p-2 text-white placeholder:text-[#00f2ff44] focus:outline-none focus:border-[#00f2ff]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#00f2ff18]">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-3 py-1.5 rounded border border-[#00f2ff22] text-slate-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#00f2ff] text-black font-bold uppercase tracking-wider hover:bg-white transition cursor-pointer"
                >
                  INITIALIZE PROJECT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

