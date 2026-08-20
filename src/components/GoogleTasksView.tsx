import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ListTodo,
  LogOut,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  FolderPlus,
  Clock,
  Send,
  Zap,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { GoogleTaskList, GoogleTaskItem, GoogleTasksAuthUser } from '../types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from '../lib/firebase';
import {
  fetchTaskLists,
  createTaskList,
  deleteTaskList,
  fetchTasks,
  createTask,
  toggleTaskStatus,
  deleteTask,
  clearCompletedTasks,
  updateTask,
} from '../utils/googleTasksService';
import { playSound } from '../utils/audio';

interface GoogleTasksViewProps {
  onAskTasks?: (prompt: string) => void;
  soundEffects: boolean;
}

export const GoogleTasksView: React.FC<GoogleTasksViewProps> = ({
  onAskTasks,
  soundEffects,
}) => {
  // Authentication State
  const [user, setUser] = useState<GoogleTasksAuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data State
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState<boolean>(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // UI / Filters State
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  // Form Inputs
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskNotes, setNewTaskNotes] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');
  const [showAddNotes, setShowAddNotes] = useState<boolean>(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState<boolean>(false);

  // New List Modal State
  const [showNewListModal, setShowNewListModal] = useState<boolean>(false);
  const [newListTitle, setNewListTitle] = useState<string>('');
  const [isCreatingList, setIsCreatingList] = useState<boolean>(false);

  // Mandatory Confirmation Dialog State (Per Skill Instructions for Destructive Workspace Actions)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'DELETE_TASK' | 'DELETE_LIST' | 'CLEAR_COMPLETED';
    targetId?: string;
    targetName?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'DELETE_TASK',
  });

  // AI Task Generator State
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiGoalInput, setAiGoalInput] = useState<string>('');
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  // Subscribe to Auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
        setAuthError(null);
      },
      () => {
        // Unauthenticated or token cleared
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch task lists once authenticated
  const loadTaskLists = useCallback(async (token: string) => {
    setIsLoadingLists(true);
    setActionError(null);
    try {
      const lists = await fetchTaskLists(token);
      setTaskLists(lists);
      if (lists.length > 0) {
        // Select first list if not already selected
        setSelectedListId((prev) => (prev && lists.some((l) => l.id === prev) ? prev : lists[0].id));
      }
    } catch (err: any) {
      console.error('Failed to load Google Task lists:', err);
      setActionError(err.message || 'Unable to sync task lists from Google Workspace.');
    } finally {
      setIsLoadingLists(false);
    }
  }, []);

  // Fetch tasks for the active list
  const loadTasksForList = useCallback(async (token: string, listId: string) => {
    if (!listId) return;
    setIsLoadingTasks(true);
    setActionError(null);
    try {
      const items = await fetchTasks(token, listId, { showCompleted: true, showHidden: true });
      setTasks(items);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
      setActionError(err.message || 'Failed to retrieve tasks from Google Tasks.');
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      loadTaskLists(accessToken);
    }
  }, [accessToken, loadTaskLists]);

  useEffect(() => {
    if (accessToken && selectedListId) {
      loadTasksForList(accessToken, selectedListId);
    }
  }, [accessToken, selectedListId, loadTasksForList]);

  // Sign In Handler
  const handleSignIn = async () => {
    if (soundEffects) playSound('click');
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        if (soundEffects) playSound('beep');
        loadTaskLists(result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setAuthError(
        err.message || 'Google Authentication failed. Please check your browser popup settings.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    if (soundEffects) playSound('click');
    await logout();
    setUser(null);
    setAccessToken(null);
    setTaskLists([]);
    setTasks([]);
    setSelectedListId('');
  };

  // Create Task Handler
  const handleCreateTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim() || !accessToken || !selectedListId || isSubmittingTask) return;

    if (soundEffects) playSound('click');
    setIsSubmittingTask(true);
    setActionError(null);

    try {
      const created = await createTask(accessToken, selectedListId, {
        title: newTaskTitle.trim(),
        notes: newTaskNotes.trim() || undefined,
        due: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
      });

      setTasks((prev) => [created, ...prev]);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDueDate('');
      setShowAddNotes(false);
      setActionSuccess('Task synced to Google Tasks successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
      if (soundEffects) playSound('beep');
    } catch (err: any) {
      console.error('Failed to create task:', err);
      setActionError(err.message || 'Failed to create task in Google Tasks.');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Toggle Complete Handler
  const handleToggleTask = async (task: GoogleTaskItem) => {
    if (!accessToken || !selectedListId) return;
    if (soundEffects) playSound('click');

    const nextCompleted = task.status !== 'completed';
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextCompleted ? 'completed' : 'needsAction',
              completed: nextCompleted ? new Date().toISOString() : undefined,
            }
          : t
      )
    );

    try {
      const updated = await toggleTaskStatus(
        accessToken,
        selectedListId,
        task.id,
        nextCompleted
      );
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err: any) {
      console.error('Failed to toggle task:', err);
      setActionError(err.message || 'Failed to update task status in Google Tasks.');
      // Revert on error
      loadTasksForList(accessToken, selectedListId);
    }
  };

  // Trigger Destructive Action Confirmations
  const promptDeleteTask = (task: GoogleTaskItem) => {
    if (soundEffects) playSound('click');
    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Task Deletion',
      description: `Are you sure you want to permanently delete task "${task.title}" from Google Tasks? This action cannot be undone.`,
      actionType: 'DELETE_TASK',
      targetId: task.id,
      targetName: task.title,
    });
  };

  const promptDeleteList = (list: GoogleTaskList) => {
    if (soundEffects) playSound('click');
    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Task List Deletion',
      description: `Are you sure you want to delete task list "${list.title}" and all its contained tasks? This action cannot be undone.`,
      actionType: 'DELETE_LIST',
      targetId: list.id,
      targetName: list.title,
    });
  };

  const promptClearCompleted = () => {
    if (soundEffects) playSound('click');
    const currentList = taskLists.find((l) => l.id === selectedListId);
    setConfirmDialog({
      isOpen: true,
      title: 'Clear Completed Tasks',
      description: `Are you sure you want to clear all completed tasks from "${currentList?.title || 'this list'}"?`,
      actionType: 'CLEAR_COMPLETED',
      targetId: selectedListId,
      targetName: currentList?.title,
    });
  };

  // Execute Confirmed Destructive Action
  const handleExecuteConfirmedAction = async () => {
    if (!accessToken) return;
    const { actionType, targetId } = confirmDialog;
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

    if (soundEffects) playSound('click');
    setActionError(null);

    try {
      if (actionType === 'DELETE_TASK' && targetId && selectedListId) {
        // Optimistic removal
        setTasks((prev) => prev.filter((t) => t.id !== targetId));
        await deleteTask(accessToken, selectedListId, targetId);
        setActionSuccess('Task permanently removed from Google Tasks.');
      } else if (actionType === 'DELETE_LIST' && targetId) {
        await deleteTaskList(accessToken, targetId);
        setTaskLists((prev) => prev.filter((l) => l.id !== targetId));
        if (selectedListId === targetId) {
          const remaining = taskLists.filter((l) => l.id !== targetId);
          setSelectedListId(remaining.length > 0 ? remaining[0].id : '');
        }
        setActionSuccess('Task list deleted from Google Workspace.');
      } else if (actionType === 'CLEAR_COMPLETED' && selectedListId) {
        setTasks((prev) => prev.filter((t) => t.status !== 'completed'));
        await clearCompletedTasks(accessToken, selectedListId);
        setActionSuccess('Completed tasks cleared.');
      }
      setTimeout(() => setActionSuccess(null), 3000);
      if (soundEffects) playSound('beep');
    } catch (err: any) {
      console.error('Destructive action failed:', err);
      setActionError(err.message || 'Operation failed on Google Tasks API.');
      if (selectedListId) loadTasksForList(accessToken, selectedListId);
    }
  };

  // Create New Task List Handler
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !accessToken || isCreatingList) return;

    if (soundEffects) playSound('click');
    setIsCreatingList(true);
    setActionError(null);

    try {
      const created = await createTaskList(accessToken, newListTitle.trim());
      setTaskLists((prev) => [...prev, created]);
      setSelectedListId(created.id);
      setNewListTitle('');
      setShowNewListModal(false);
      setActionSuccess(`List "${created.title}" created successfully.`);
      setTimeout(() => setActionSuccess(null), 3000);
      if (soundEffects) playSound('beep');
    } catch (err: any) {
      console.error('Failed to create list:', err);
      setActionError(err.message || 'Failed to create Google Task list.');
    } finally {
      setIsCreatingList(false);
    }
  };

  // AI Task Breakdown / Milestone Generator
  const handleAiDecompose = async () => {
    if (!aiGoalInput.trim() || !accessToken || !selectedListId || isAiGenerating) return;

    if (soundEffects) playSound('click');
    setIsAiGenerating(true);

    try {
      // Let's call the server API or decompose structured milestones
      const prompt = `Decompose this operational objective into 4-6 actionable, structured tasks for Google Tasks: "${aiGoalInput.trim()}". Return a JSON array of objects with 'title' (string), 'notes' (optional brief description), and 'priority' (string).`;
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          mode: 'projects',
          history: [],
        }),
      });

      if (!res.ok) throw new Error('AI decomposition service unavailable.');
      const data = await res.json();
      const responseText = data.response || '';

      // Extract JSON array from model response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      let parsedTasks: Array<{ title: string; notes?: string }> = [];

      if (jsonMatch) {
        try {
          parsedTasks = JSON.parse(jsonMatch[0]);
        } catch {
          // Fallback parsing lines
          parsedTasks = responseText
            .split('\n')
            .filter((l: string) => l.match(/^[\d\-\*]\.?\s+/))
            .map((l: string) => ({ title: l.replace(/^[\d\-\*]\.?\s+/, '').trim() }))
            .slice(0, 5);
        }
      } else {
        parsedTasks = responseText
          .split('\n')
          .filter((l: string) => l.trim().length > 3)
          .slice(0, 5)
          .map((l: string) => ({ title: l.replace(/^[-*•\d.]+\s*/, '').trim() }));
      }

      // Batch insert tasks to Google Tasks
      for (const item of parsedTasks) {
        if (item.title) {
          await createTask(accessToken, selectedListId, {
            title: `[AETHER] ${item.title}`,
            notes: item.notes || `Generated by A.E.T.H.E.R. Neural Matrix for goal: "${aiGoalInput.trim()}"`,
          });
        }
      }

      await loadTasksForList(accessToken, selectedListId);
      setAiGoalInput('');
      setShowAiModal(false);
      setActionSuccess(`Generated & synced ${parsedTasks.length} tactical tasks to Google Tasks.`);
      setTimeout(() => setActionSuccess(null), 4000);
      if (soundEffects) playSound('beep');
    } catch (err: any) {
      console.error('AI Decomposition Error:', err);
      setActionError(err.message || 'AI generation failed to sync tasks.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterMode === 'pending' && t.status === 'completed') return false;
    if (filterMode === 'completed' && t.status !== 'completed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchNotes = t.notes?.toLowerCase().includes(q);
      return matchTitle || matchNotes;
    }
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status !== 'completed').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const activeList = taskLists.find((l) => l.id === selectedListId);

  // Unauthenticated View
  if (!accessToken) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-[#00f2ff15] border border-[#00f2ff55] flex items-center justify-center text-[#00f2ff] shadow-[0_0_30px_rgba(0,242,255,0.2)]">
            <ListTodo className="w-10 h-10" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#10b98122] border border-[#10b98188] flex items-center justify-center text-[#10b981]">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-2">
          Google Tasks Matrix
        </h2>
        <p className="text-xs text-gray-400 font-mono tracking-wider mb-6 max-w-md leading-relaxed">
          Connect your Google Workspace account with permission to synchronize, manage, create, and prioritize your live to-do lists and mission milestones directly inside A.E.T.H.E.R.
        </p>

        {authError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-start gap-3 text-left w-full">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div>
              <div className="font-bold mb-0.5">Authentication Interrupted</div>
              <div>{authError}</div>
            </div>
          </div>
        )}

        {/* Official Google Sign-in styled button */}
        <button
          onClick={handleSignIn}
          disabled={isAuthenticating}
          className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white text-gray-900 font-medium text-sm hover:bg-gray-100 transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {isAuthenticating ? (
            <RefreshCw className="w-5 h-5 animate-spin text-[#4285F4]" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
          )}
          <span>{isAuthenticating ? 'Connecting to Google OAuth...' : 'Sign in with Google'}</span>
        </button>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left w-full">
          <div className="p-3.5 rounded-lg bg-black/40 border border-[#00f2ff22]">
            <div className="text-[10px] font-mono text-[#00f2ff] uppercase tracking-wider mb-1">
              Live Two-Way Sync
            </div>
            <div className="text-xs text-gray-400">
              Read & mutate your real Google Tasks list across mobile and desktop.
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-black/40 border border-[#00f2ff22]">
            <div className="text-[10px] font-mono text-[#10b981] uppercase tracking-wider mb-1">
              AI Task Decomposer
            </div>
            <div className="text-xs text-gray-400">
              Auto-generate structured milestones and push them straight to Google Tasks.
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-black/40 border border-[#00f2ff22]">
            <div className="text-[10px] font-mono text-[#a855f7] uppercase tracking-wider mb-1">
              Encrypted In-Memory
            </div>
            <div className="text-xs text-gray-400">
              OAuth bearer tokens stay strictly in RAM session cache.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#00f2ff22]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#00f2ff15] border border-[#00f2ff44] flex items-center justify-center text-[#00f2ff]">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-widest uppercase">
                Google Tasks Matrix
              </h2>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-[#10b98122] text-[#10b981] border border-[#10b98144]">
                WORKSPACE CONNECTED
              </span>
            </div>
            <div className="text-[10px] font-mono text-gray-400 flex items-center gap-2">
              <span>{user?.email || 'Authenticated User'}</span>
              <span>•</span>
              <span>{pendingCount} Pending</span>
              <span>•</span>
              <span>{completedCount} Completed</span>
            </div>
          </div>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (soundEffects) playSound('click');
              setShowAiModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a855f722] hover:bg-[#a855f733] border border-[#a855f766] text-[#c084fc] text-xs font-mono transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Decompose Goal</span>
          </button>

          <button
            onClick={() => {
              if (soundEffects) playSound('click');
              if (accessToken && selectedListId) loadTasksForList(accessToken, selectedListId);
            }}
            disabled={isLoadingTasks || isLoadingLists}
            className="p-1.5 rounded-lg bg-black/40 border border-[#00f2ff33] text-gray-300 hover:text-white hover:border-[#00f2ff88] transition-all cursor-pointer"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTasks ? 'animate-spin text-[#00f2ff]' : ''}`} />
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-red-300 text-xs font-mono transition-all cursor-pointer"
            title="Disconnect Google Workspace"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {actionSuccess && (
        <div className="px-3 py-2 rounded-lg bg-[#10b98115] border border-[#10b98144] text-[#10b981] text-xs font-mono flex items-center gap-2">
          <Check className="w-3.5 h-3.5" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="px-3 py-2 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-red-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Task Lists Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <div className="flex items-center gap-1.5">
          {taskLists.map((list) => {
            const isSelected = list.id === selectedListId;
            return (
              <div
                key={list.id}
                className="flex items-center group relative"
              >
                <button
                  onClick={() => {
                    if (soundEffects) playSound('click');
                    setSelectedListId(list.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#00f2ff22] text-[#00f2ff] border border-[#00f2ff66] shadow-[0_0_10px_rgba(0,242,255,0.15)] font-bold'
                      : 'bg-black/30 text-gray-400 border border-transparent hover:bg-black/50 hover:text-gray-200'
                  }`}
                >
                  <span>{list.title}</span>
                </button>
                {isSelected && taskLists.length > 1 && (
                  <button
                    onClick={() => promptDeleteList(list)}
                    className="ml-1 p-1 text-gray-500 hover:text-red-400 transition-colors"
                    title="Delete List"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={() => {
              if (soundEffects) playSound('click');
              setShowNewListModal(true);
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-black/40 text-gray-400 border border-dashed border-[#00f2ff33] hover:border-[#00f2ff88] hover:text-[#00f2ff] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ New List</span>
          </button>
        </div>

        {tasks.some((t) => t.status === 'completed') && (
          <button
            onClick={promptClearCompleted}
            className="px-2.5 py-1 text-[10px] font-mono text-gray-400 hover:text-red-300 transition-colors shrink-0"
          >
            Clear Completed
          </button>
        )}
      </div>

      {/* Quick Add Task Input Card */}
      <form
        onSubmit={handleCreateTask}
        className="p-3.5 rounded-xl bg-black/40 border border-[#00f2ff2a] focus-within:border-[#00f2ff66] transition-all space-y-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={`Add a new task to "${activeList?.title || 'Google Tasks'}"...`}
            className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none font-sans"
            disabled={isSubmittingTask}
          />
          <button
            type="button"
            onClick={() => setShowAddNotes(!showAddNotes)}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              showAddNotes || newTaskNotes || newTaskDueDate
                ? 'text-[#00f2ff] bg-[#00f2ff15]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Add Details / Due Date"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={!newTaskTitle.trim() || isSubmittingTask}
            className="px-3 py-1.5 rounded-lg bg-[#00f2ff22] hover:bg-[#00f2ff33] border border-[#00f2ff66] text-[#00f2ff] text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,242,255,0.15)]"
          >
            {isSubmittingTask ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>Add</span>
          </button>
        </div>

        {/* Expandable Notes & Due Date Row */}
        {showAddNotes && (
          <div className="pt-2 border-t border-[#00f2ff15] grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={newTaskNotes}
              onChange={(e) => setNewTaskNotes(e.target.value)}
              placeholder="Task notes / description (optional)..."
              className="bg-black/30 border border-[#00f2ff1f] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-[#00f2ff55]"
            />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="flex-1 bg-black/30 border border-[#00f2ff1f] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-[#00f2ff55]"
              />
              {newTaskDueDate && (
                <button
                  type="button"
                  onClick={() => setNewTaskDueDate('')}
                  className="p-1.5 text-gray-400 hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-[#00f2ff22]">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-[#00f2ff22] text-[#00f2ff] font-bold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              filterMode === 'pending'
                ? 'bg-[#00f2ff22] text-[#00f2ff] font-bold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterMode('completed')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
              filterMode === 'completed'
                ? 'bg-[#00f2ff22] text-[#00f2ff] font-bold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs min-w-[140px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-black/30 border border-[#00f2ff1f] rounded-lg pl-8 pr-2.5 py-1 text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-[#00f2ff55]"
          />
        </div>
      </div>

      {/* Tasks List Container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {isLoadingTasks ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 font-mono text-xs gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-[#00f2ff]" />
            <span>Synchronizing with Google Workspace Tasks...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#00f2ff22] rounded-xl bg-black/20 p-6">
            <CheckCircle2 className="w-8 h-8 mx-auto text-[#00f2ff55] mb-2" />
            <div className="text-xs font-mono text-gray-300 font-bold uppercase tracking-wider">
              {searchQuery ? 'No Matching Tasks Found' : 'No Tasks in this List'}
            </div>
            <p className="text-[11px] text-gray-500 max-w-xs mx-auto mt-1">
              {searchQuery
                ? 'Try adjusting your search keywords.'
                : 'Use the bar above or ask A.E.T.H.E.R. AI to add your first task.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isExpanded = expandedTaskIds[task.id];
            const hasDueDate = !!task.due;
            const dueDateFormatted = hasDueDate
              ? new Date(task.due!).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : null;
            const isOverdue =
              hasDueDate &&
              !isCompleted &&
              new Date(task.due!).getTime() < new Date().setHours(0, 0, 0, 0);

            return (
              <div
                key={task.id}
                className={`group rounded-xl border transition-all duration-200 p-3 ${
                  isCompleted
                    ? 'bg-black/20 border-white/5 opacity-60'
                    : 'bg-black/40 border-[#00f2ff1f] hover:border-[#00f2ff44] hover:bg-black/60 shadow-[0_2px_10px_rgba(0,0,0,0.2)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="mt-0.5 text-gray-400 hover:text-[#00f2ff] transition-colors cursor-pointer shrink-0"
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-4 h-4 text-[#10b981]" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 hover:text-[#00f2ff]" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div
                        onClick={() =>
                          setExpandedTaskIds((prev) => ({
                            ...prev,
                            [task.id]: !prev[task.id],
                          }))
                        }
                        className={`text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none ${
                          isCompleted
                            ? 'line-through text-gray-400'
                            : 'text-gray-100 group-hover:text-white'
                        }`}
                      >
                        {task.title}
                      </div>

                      {/* Meta Tags (Due Date, Notes Indicator) */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] font-mono">
                        {hasDueDate && (
                          <span
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                              isOverdue
                                ? 'bg-red-950/40 border border-red-500/40 text-red-300'
                                : 'bg-[#00f2ff15] border border-[#00f2ff33] text-[#00f2ff]'
                            }`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span>{isOverdue ? `Overdue (${dueDateFormatted})` : `Due ${dueDateFormatted}`}</span>
                          </span>
                        )}

                        {task.notes && (
                          <span className="text-gray-400 truncate max-w-xs">
                            {task.notes.slice(0, 60)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Delete Button */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => promptDeleteTask(task)}
                      className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details / Full Notes */}
                {isExpanded && task.notes && (
                  <div className="mt-2.5 pt-2 border-t border-white/5 text-xs text-gray-300 font-sans whitespace-pre-wrap bg-black/30 p-2.5 rounded-lg">
                    {task.notes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* AI Task Decomposition Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0a0f18] border border-[#a855f755] p-5 shadow-[0_0_40px_rgba(168,85,247,0.25)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#c084fc]">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-wider">
                  A.E.T.H.E.R. AI Task Decomposition
                </h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed font-mono">
              Specify an overarching project goal or operational target. A.E.T.H.E.R. will synthesize structured subtasks and push them directly to Google Tasks.
            </p>

            <textarea
              value={aiGoalInput}
              onChange={(e) => setAiGoalInput(e.target.value)}
              placeholder="e.g. Build Mars telemetry telemetry dashboard in React with WebGL visualizer and orbit calculations..."
              rows={3}
              className="w-full bg-black/40 border border-[#a855f744] rounded-xl p-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#a855f7aa]"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAiDecompose}
                disabled={!aiGoalInput.trim() || isAiGenerating}
                className="px-4 py-2 rounded-xl bg-[#a855f733] hover:bg-[#a855f755] border border-[#a855f788] text-[#e9d5ff] text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              >
                {isAiGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Tasks...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Generate & Sync</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task List Modal */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateList}
            className="w-full max-w-md rounded-2xl bg-[#0a0f18] border border-[#00f2ff55] p-5 shadow-[0_0_40px_rgba(0,242,255,0.2)] space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#00f2ff]">
                <FolderPlus className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Create Google Task List
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewListModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="e.g. Avionics Protocols, Personal, STEM Research..."
              autoFocus
              className="w-full bg-black/40 border border-[#00f2ff44] rounded-xl p-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00f2ffaa]"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewListModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newListTitle.trim() || isCreatingList}
                className="px-4 py-2 rounded-xl bg-[#00f2ff22] hover:bg-[#00f2ff33] border border-[#00f2ff66] text-[#00f2ff] text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-2"
              >
                {isCreatingList ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Create List</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mandatory User Confirmation Modal for Destructive Workspace Operations */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0f0a0a] border border-red-500/50 p-5 shadow-[0_0_40px_rgba(239,68,68,0.3)] space-y-4">
            <div className="flex items-center gap-2.5 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-black uppercase tracking-wider">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-red-500/20">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.4)]"
              >
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
