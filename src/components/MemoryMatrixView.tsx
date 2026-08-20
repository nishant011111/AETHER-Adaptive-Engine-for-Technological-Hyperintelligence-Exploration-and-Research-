import React, { useState, useEffect } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Search,
  CheckCircle2,
  Sparkles,
  Shield,
  Layers,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  FileText,
  Download,
  Upload,
  Cpu,
  Zap,
  Activity,
  History,
  Tag,
  Sliders,
  Check,
  AlertCircle,
  BarChart3,
  Bot,
} from 'lucide-react';
import { MemoryItem, ChatMessage, RetrainResult } from '../types';
import { playSound } from '../utils/audio';
import { OfflineMemoryManager } from '../utils/offlineEngine';

interface MemoryMatrixViewProps {
  onAskMemory: (prompt: string) => void;
  soundEffects: boolean;
  messages?: ChatMessage[];
}

export const MemoryMatrixView: React.FC<MemoryMatrixViewProps> = ({
  onAskMemory,
  soundEffects,
  messages = [],
}) => {
  const [memories, setMemories] = useState<MemoryItem[]>(() => OfflineMemoryManager.getLocalMemories());
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [activeSourceFilter, setActiveSourceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRetrainModal, setShowRetrainModal] = useState(false);
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(!navigator.onLine);
  
  // Form States
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('IMPORTANT_FACTS');
  const [newTags, setNewTags] = useState('');
  
  // Document Ingest Form
  const [ingestTitle, setIngestTitle] = useState('');
  const [ingestText, setIngestText] = useState('');
  const [ingestCategory, setIngestCategory] = useState<MemoryItem['category']>('IMPORTANT_FACTS');

  // Retrain Engine States
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainProgress, setRetrainProgress] = useState(0);
  const [retrainLogs, setRetrainLogs] = useState<string[]>([]);
  const [retrainResult, setRetrainResult] = useState<RetrainResult | null>(null);
  const [customRetrainText, setCustomRetrainText] = useState('');
  const [retrainSourceMode, setRetrainSourceMode] = useState<'CURRENT_CHAT' | 'ALL_HISTORY' | 'CUSTOM_TEXT'>('ALL_HISTORY');
  const [autoLearnEnabled, setAutoLearnEnabled] = useState(true);
  const [copiedExport, setCopiedExport] = useState(false);

  const fetchMemories = () => {
    // Load instant local offline memories first
    const local = OfflineMemoryManager.getLocalMemories();
    setMemories(local);

    // Attempt remote sync if online
    if (navigator.onLine) {
      fetch('/api/memory')
        .then((res) => res.json())
        .then((data) => {
          if (data.memories) {
            OfflineMemoryManager.syncWithRemote(data.memories);
            setMemories(OfflineMemoryManager.getLocalMemories());
          }
        })
        .catch(() => {
          setIsOfflineMode(true);
        });
    }
  };

  useEffect(() => {
    fetchMemories();

    const handleOnline = () => {
      setIsOfflineMode(false);
      fetchMemories();
    };
    const handleOffline = () => setIsOfflineMode(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const categories = [
    'ALL',
    'USER_PROFILE',
    'PREFERENCES',
    'PROJECTS',
    'SYSTEM_OVERRIDE',
    'GOALS',
    'IMPORTANT_FACTS',
    'CONVERSATION_CONTEXT',
    'SYSTEM_CONTROL',
  ];

  const sourceFilters = [
    { key: 'ALL', label: 'ALL SOURCES' },
    { key: 'CHAT_EXTRACTION', label: '⚡ AUTO-LEARNED' },
    { key: 'NEURAL_RETRAIN', label: '🧠 RETRAINED' },
    { key: 'DOCUMENT_INGEST', label: '📄 DOC INGEST' },
    { key: 'MANUAL_ENTRY', label: '✍️ MANUAL' },
    { key: 'SYSTEM_DEFAULT', label: '🛡️ CORE IDENTITY' },
  ];

  // Add Manual Memory
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    if (soundEffects) playSound('chime');

    const tagsArray = newTags
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);

    // 1. Immediately save to Local State Engine
    const saved = OfflineMemoryManager.saveLocalMemory(
      newTitle.trim() || `Entry ${new Date().toLocaleDateString()}`,
      newContent.trim(),
      newCategory,
      false,
      'MANUAL_ENTRY',
      tagsArray.length > 0 ? tagsArray : [newCategory.toLowerCase()]
    );

    setMemories(OfflineMemoryManager.getLocalMemories());
    setShowAddModal(false);
    setNewTitle('');
    setNewContent('');
    setNewTags('');

    // 2. Sync to backend if accessible
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: saved.title,
          content: saved.content,
          category: saved.category,
          source: saved.source,
          tags: saved.tags,
        }),
      });
    } catch {
      // Offline fallback state is active
    }
  };

  // Document Ingestion Handler
  const handleIngestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestText.trim()) return;

    if (soundEffects) playSound('chime');

    // 1. Local Ingestion
    const createdLocal = OfflineMemoryManager.ingestRawDataDocument(
      ingestTitle.trim() || 'Ingested Document',
      ingestText.trim()
    );
    setMemories(OfflineMemoryManager.getLocalMemories());
    setShowIngestModal(false);
    setIngestTitle('');
    setIngestText('');

    // 2. Server-side Ingestion Sync
    try {
      await fetch('/api/memory/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ingestTitle.trim() || 'Ingested Document',
          rawText: ingestText.trim(),
          category: ingestCategory,
        }),
      });
    } catch {
      // Local sync active
    }
  };

  // Neural Retraining Handler (From Chat History / Conversations)
  const handleExecuteRetrain = async () => {
    if (soundEffects) playSound('pulse');
    setIsRetraining(true);
    setRetrainProgress(10);
    setRetrainLogs(['Initializing A.E.T.H.E.R. Neural Retraining Subsystem...']);
    setRetrainResult(null);

    try {
      // Step 1: Collect messages
      let targetMessages: ChatMessage[] = [];
      if (retrainSourceMode === 'CURRENT_CHAT') {
        targetMessages = messages.length > 0 ? messages : OfflineMemoryManager.getPersistentChatHistory();
      } else if (retrainSourceMode === 'ALL_HISTORY') {
        const persistent = OfflineMemoryManager.getPersistentChatHistory();
        targetMessages = persistent.length > 0 ? persistent : messages;
      }

      setRetrainProgress(30);
      setRetrainLogs((prev) => [
        ...prev,
        `Aggregated ${targetMessages.length} conversation turns for semantic extraction...`,
      ]);

      let result: RetrainResult;

      if (navigator.onLine && retrainSourceMode !== 'CUSTOM_TEXT') {
        setRetrainProgress(50);
        setRetrainLogs((prev) => [
          ...prev,
          'Engaging Gemini 3.7 Flash Memory Distillation Core...',
        ]);

        const res = await fetch('/api/memory/retrain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: targetMessages,
          }),
        });

        if (!res.ok) throw new Error('Remote retrain API error');
        result = await res.json();
      } else {
        // Offline / Custom fallback
        setRetrainProgress(65);
        setRetrainLogs((prev) => [
          ...prev,
          'Processing conversation shards via Local Heuristic Pattern Engine...',
        ]);
        if (retrainSourceMode === 'CUSTOM_TEXT' && customRetrainText) {
          const shards = OfflineMemoryManager.ingestRawDataDocument('Retrained Note', customRetrainText);
          result = {
            success: true,
            messagesAnalyzed: 1,
            newMemoriesCount: shards.length,
            updatedMemoriesCount: OfflineMemoryManager.getLocalMemories().length,
            distilledMemories: shards,
            summary: `Distilled ${shards.length} memory shards from custom text.`,
            timestamp: new Date().toISOString(),
          };
        } else {
          result = OfflineMemoryManager.retrainFromChatHistory(targetMessages);
        }
      }

      setRetrainProgress(90);
      setRetrainLogs((prev) => [
        ...prev,
        `Extracted ${result.newMemoriesCount} high-density memory nodes.`,
        'Updating active memory matrix and neural weights...',
      ]);

      // Re-fetch updated memories
      fetchMemories();

      setTimeout(() => {
        setRetrainProgress(100);
        setIsRetraining(false);
        setRetrainResult(result);
        if (soundEffects) playSound('chime');
      }, 600);
    } catch (err: any) {
      console.warn('Remote retrain fallback to local parser:', err);
      const fallbackMessages = OfflineMemoryManager.getPersistentChatHistory();
      const localResult = OfflineMemoryManager.retrainFromChatHistory(
        fallbackMessages.length > 0 ? fallbackMessages : messages
      );
      setRetrainProgress(100);
      setIsRetraining(false);
      setRetrainResult(localResult);
      fetchMemories();
      if (soundEffects) playSound('chime');
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (soundEffects) playSound('click');

    // 1. Delete locally
    OfflineMemoryManager.deleteLocalMemory(id);
    setMemories(OfflineMemoryManager.getLocalMemories());

    // 2. Sync deletion to remote backend if accessible
    try {
      await fetch(`/api/memory/${id}`, { method: 'DELETE' });
    } catch {
      // Local deletion remains persistent
    }
  };

  const handleTogglePin = (id: string) => {
    if (soundEffects) playSound('click');
    const updated = memories.map((m) => {
      if (m.id === id) {
        return { ...m, pinned: !m.pinned };
      }
      return m;
    });
    OfflineMemoryManager.saveAllLocalMemories(updated);
    setMemories(updated);
  };

  const handleClearAll = async () => {
    if (soundEffects) playSound('error');
    const local = OfflineMemoryManager.getLocalMemories().filter((m) => m.id === 'mem-1');
    localStorage.setItem('aether_local_memory_matrix_v1', JSON.stringify(local));
    setMemories(local);
    setShowClearConfirm(false);

    try {
      await fetch('/api/memory', { method: 'DELETE' });
    } catch {
      // Local clear successful
    }
  };

  const handleExportJson = () => {
    if (soundEffects) playSound('chime');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(memories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aether-memory-matrix-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyExport = () => {
    if (soundEffects) playSound('click');
    navigator.clipboard.writeText(JSON.stringify(memories, null, 2));
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  // Filter Memories
  const filteredMemories = memories.filter((m) => {
    const matchesCategory = activeCategory === 'ALL' || m.category === activeCategory;
    const matchesSource =
      activeSourceFilter === 'ALL' ||
      m.source === activeSourceFilter ||
      (!m.source && activeSourceFilter === 'MANUAL_ENTRY');
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      m.title.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      (m.tags && m.tags.some((t) => t.toLowerCase().includes(q)));
    return matchesCategory && matchesSource && matchesSearch;
  });

  // Calculate Metrics
  const retrainedCount = memories.filter((m) => m.source === 'NEURAL_RETRAIN').length;
  const autoLearnedCount = memories.filter((m) => m.source === 'CHAT_EXTRACTION').length;
  const ingestedCount = memories.filter((m) => m.source === 'DOCUMENT_INGEST').length;
  const pinnedCount = memories.filter((m) => m.pinned).length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto font-mono text-[#00f2ff]">
      {/* Top Banner & Action Deck */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-[#00f2ff33] bg-[#050508cc] backdrop-blur-md shadow-[0_0_20px_#00f2ff11]">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-lg border border-[#00f2ff55] bg-[#00f2ff18] text-[#00f2ff] shadow-[0_0_15px_#00f2ff33] shrink-0">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold font-display text-white tracking-widest uppercase">
                AETHER NEURAL MEMORY & RETRAINING MATRIX
              </h1>
              <span
                className={`text-[9px] uppercase px-2 py-0.5 rounded border font-mono ${
                  isOfflineMode
                    ? 'border-amber-500/50 bg-amber-950/40 text-amber-300'
                    : 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                }`}
              >
                {isOfflineMode ? 'LOCAL OFFLINE STORAGE' : 'REMOTE & CLOUD SYNC ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous learning engine. Automatically saves all ingested chat data and distills previous conversations into permanent neural memory.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (soundEffects) playSound('click');
              setShowRetrainModal(true);
            }}
            className="px-3.5 py-1.5 rounded border border-[#7000ff]/60 bg-[#7000ff]/20 hover:bg-[#7000ff]/30 text-purple-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(112,0,255,0.3)]"
            title="Retrain and synthesize memory nodes from previous conversation transcripts"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-300" />
            <span>RETRAIN FROM CHATS</span>
          </button>

          <button
            onClick={() => {
              if (soundEffects) playSound('click');
              setShowIngestModal(true);
            }}
            className="px-3 py-1.5 rounded border border-[#00f2ff44] bg-[#00f2ff11] hover:bg-[#00f2ff22] text-[#00f2ff] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Ingest raw text, notes, or datasets into memory shards"
          >
            <FileText className="w-3.5 h-3.5 text-[#00f2ff]" />
            <span>INGEST DATA</span>
          </button>

          <button
            onClick={() => {
              if (soundEffects) playSound('click');
              setShowAddModal(true);
            }}
            className="px-3 py-1.5 rounded border border-[#00f2ff44] bg-[#00f2ff18] hover:bg-[#00f2ff28] text-[#00f2ff] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#00f2ff]" />
            <span>RECORD</span>
          </button>

          <button
            onClick={handleExportJson}
            className="p-1.5 rounded border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
            title="Download Memory Matrix JSON backup"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (soundEffects) playSound('error');
              setShowClearConfirm(true);
            }}
            className="px-2.5 py-1.5 rounded border border-rose-500/30 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 text-xs transition cursor-pointer"
            title="Reset auxiliary memories"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Memory Telemetry & Continuous Ingestion Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-[#00f2ff22] bg-[#090912cc] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Shards</div>
            <div className="text-xl font-bold text-white font-display mt-0.5">{memories.length}</div>
          </div>
          <Database className="w-5 h-5 text-[#00f2ff] opacity-60" />
        </div>

        <div className="p-3 rounded-lg border border-purple-500/30 bg-[#0e0718cc] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-purple-300 uppercase tracking-wider">Retrained Nodes</div>
            <div className="text-xl font-bold text-purple-200 font-display mt-0.5">{retrainedCount}</div>
          </div>
          <Cpu className="w-5 h-5 text-purple-400 opacity-70" />
        </div>

        <div className="p-3 rounded-lg border border-emerald-500/30 bg-[#06140ecc] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-emerald-300 uppercase tracking-wider">Auto-Learned</div>
            <div className="text-xl font-bold text-emerald-200 font-display mt-0.5">{autoLearnedCount}</div>
          </div>
          <Zap className="w-5 h-5 text-emerald-400 opacity-70" />
        </div>

        <div className="p-3 rounded-lg border border-amber-500/30 bg-[#140f06cc] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-amber-300 uppercase tracking-wider">Pinned Directives</div>
            <div className="text-xl font-bold text-amber-200 font-display mt-0.5">{pinnedCount}</div>
          </div>
          <Pin className="w-5 h-5 text-amber-400 opacity-70" />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-2">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                if (soundEffects) playSound('click');
                setActiveCategory(cat);
              }}
              className={`px-3 py-1 rounded text-[11px] whitespace-nowrap transition border cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#00f2ff22] border-[#00f2ff] text-[#00f2ff] shadow-[0_0_10px_#00f2ff33]'
                  : 'border-[#00f2ff18] bg-[#11112288] text-slate-400 hover:text-white'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Source Badges & Search Box */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
            {sourceFilters.map((sf) => (
              <button
                key={sf.key}
                onClick={() => {
                  if (soundEffects) playSound('click');
                  setActiveSourceFilter(sf.key);
                }}
                className={`px-2.5 py-0.5 rounded text-[10px] whitespace-nowrap transition border cursor-pointer ${
                  activeSourceFilter === sf.key
                    ? 'border-[#7000ff] bg-[#7000ff]/30 text-purple-200 font-bold'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memory shards or tags..."
              className="w-full bg-[#111122] border border-[#00f2ff33] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#00f2ff44] focus:outline-none focus:border-[#00f2ff]"
            />
          </div>
        </div>
      </div>

      {/* Memory Cards Grid */}
      {filteredMemories.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-[#00f2ff22] bg-[#050508aa] space-y-3">
          <Brain className="w-8 h-8 text-[#00f2ff44] mx-auto" />
          <div className="text-sm font-bold text-slate-300">No matching memory shards found.</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search criteria or click "RETRAIN FROM CHATS" to distill new insights from your conversation history.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.map((mem) => {
            const isRetrained = mem.source === 'NEURAL_RETRAIN';
            const isAutoLearned = mem.source === 'CHAT_EXTRACTION';
            const isDocIngest = mem.source === 'DOCUMENT_INGEST';

            return (
              <div
                key={mem.id}
                className={`p-4 rounded-xl border backdrop-blur-md space-y-3 flex flex-col justify-between transition ${
                  mem.pinned
                    ? 'border-[#00f2ff55] bg-[#111122ee] shadow-[0_0_15px_#00f2ff18]'
                    : isRetrained
                    ? 'border-purple-500/30 bg-[#0d0718cc] hover:border-purple-500/60'
                    : isAutoLearned
                    ? 'border-emerald-500/30 bg-[#06140ecc] hover:border-emerald-500/60'
                    : isDocIngest
                    ? 'border-cyan-500/30 bg-[#051118cc] hover:border-cyan-500/60'
                    : 'border-[#00f2ff18] bg-[#050508bb] hover:border-[#00f2ff44]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-[#00f2ff11] border border-[#00f2ff33] text-[#00f2ff]">
                        {mem.category.replace('_', ' ')}
                      </span>
                      {mem.source && (
                        <span
                          className={`text-[8px] uppercase px-1.5 py-0.2 rounded border font-mono ${
                            isRetrained
                              ? 'border-purple-500/40 bg-purple-950/40 text-purple-300'
                              : isAutoLearned
                              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                              : isDocIngest
                              ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300'
                              : 'border-slate-700 bg-slate-900/60 text-slate-400'
                          }`}
                        >
                          {isRetrained
                            ? 'Retrained'
                            : isAutoLearned
                            ? 'Auto-Learned'
                            : isDocIngest
                            ? 'Doc Ingest'
                            : 'Manual'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(mem.id)}
                        className={`p-1 rounded transition ${
                          mem.pinned ? 'text-[#00f2ff]' : 'text-slate-600 hover:text-slate-300'
                        }`}
                        title={mem.pinned ? 'Unpin memory' : 'Pin to priority buffer'}
                      >
                        {mem.pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                      </button>
                      {mem.id !== 'mem-1' && (
                        <button
                          onClick={() => handleDeleteMemory(mem.id)}
                          className="p-1 rounded text-slate-600 hover:text-rose-400 transition"
                          title="Delete memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white font-display leading-snug">{mem.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">{mem.content}</p>

                  {mem.tags && mem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {mem.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[8px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-400"
                        >
                          #{tag.toLowerCase()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#00f2ff18] flex items-center justify-between text-[10px] text-slate-500">
                  <span>{new Date(mem.timestamp).toLocaleDateString()}</span>
                  <button
                    onClick={() =>
                      onAskMemory(
                        `A.E.T.H.E.R., recall and synthesize our memory regarding: "${mem.title}". Detail: ${mem.content}`
                      )
                    }
                    className="text-[#00f2ff] hover:text-white transition flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>QUERY IN CHAT</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Retrain from Previous Chats Modal */}
      {showRetrainModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl p-6 rounded-xl border border-purple-500/40 bg-[#07050cee] shadow-[0_0_40px_rgba(112,0,255,0.3)] space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300">
                  <RefreshCw className={`w-4 h-4 ${isRetraining ? 'animate-spin' : ''}`} />
                </div>
                <h3 className="text-sm font-bold text-white tracking-widest uppercase">
                  NEURAL RETRAINING & KNOWLEDGE DISTILLATION
                </h3>
              </div>
              <button
                onClick={() => setShowRetrainModal(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Analyze all preceding conversations, user instructions, facts, and code exchanges between Nishant and A.E.T.H.E.R. Synthesize structured high-density knowledge shards and inject them into the active reasoning core.
            </p>

            {/* Source Mode Selector */}
            <div className="space-y-1.5">
              <label className="block text-purple-300 text-[11px] uppercase tracking-wider">
                TRAINING SOURCE TRANSCIPT:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRetrainSourceMode('ALL_HISTORY')}
                  className={`p-2 rounded border transition text-center cursor-pointer ${
                    retrainSourceMode === 'ALL_HISTORY'
                      ? 'border-purple-500 bg-purple-950/50 text-white font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <History className="w-3.5 h-3.5 mx-auto mb-1 text-purple-400" />
                  <span>All Conversation Logs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRetrainSourceMode('CURRENT_CHAT')}
                  className={`p-2 rounded border transition text-center cursor-pointer ${
                    retrainSourceMode === 'CURRENT_CHAT'
                      ? 'border-purple-500 bg-purple-950/50 text-white font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 mx-auto mb-1 text-purple-400" />
                  <span>Current Active Session</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRetrainSourceMode('CUSTOM_TEXT')}
                  className={`p-2 rounded border transition text-center cursor-pointer ${
                    retrainSourceMode === 'CUSTOM_TEXT'
                      ? 'border-purple-500 bg-purple-950/50 text-white font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 mx-auto mb-1 text-purple-400" />
                  <span>Paste Custom Transcript</span>
                </button>
              </div>
            </div>

            {retrainSourceMode === 'CUSTOM_TEXT' && (
              <div>
                <label className="block text-slate-400 mb-1 text-[11px]">PASTE TRANSCRIPT / NOTES DATASET:</label>
                <textarea
                  rows={4}
                  value={customRetrainText}
                  onChange={(e) => setCustomRetrainText(e.target.value)}
                  placeholder="Paste conversation transcript, meeting notes, project specs, or factual documentation..."
                  className="w-full bg-[#111122] border border-purple-500/30 rounded p-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
                />
              </div>
            )}

            {/* Retraining Progress Indicator */}
            {isRetraining && (
              <div className="space-y-2 p-3 rounded-lg border border-purple-500/30 bg-purple-950/20">
                <div className="flex items-center justify-between text-xs text-purple-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-purple-400 animate-spin" />
                    <span>Distilling Knowledge Vectors...</span>
                  </span>
                  <span>{retrainProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-[#00f2ff] h-full transition-all duration-300"
                    style={{ width: `${retrainProgress}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-mono space-y-0.5 max-h-24 overflow-y-auto">
                  {retrainLogs.map((log, idx) => (
                    <div key={idx}>▸ {log}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Result Summary */}
            {retrainResult && (
              <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-950/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{retrainResult.summary}</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Total Active Memory Matrix: <strong className="text-white">{retrainResult.updatedMemoriesCount}</strong> nodes.
                </div>
                {retrainResult.distilledMemories && retrainResult.distilledMemories.length > 0 && (
                  <div className="space-y-1 pt-1 max-h-32 overflow-y-auto">
                    {retrainResult.distilledMemories.map((m, idx) => (
                      <div key={idx} className="text-[10px] text-slate-400 border-l border-emerald-500/40 pl-2">
                        <strong className="text-emerald-200">{m.title}</strong>: {m.content.slice(0, 70)}...
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-purple-500/20">
              <button
                type="button"
                onClick={() => setShowRetrainModal(false)}
                className="px-3 py-1.5 rounded border border-slate-700 text-slate-400 hover:text-white cursor-pointer text-xs"
              >
                CLOSE
              </button>
              <button
                type="button"
                disabled={isRetraining}
                onClick={handleExecuteRetrain}
                className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold uppercase tracking-wider text-xs transition cursor-pointer shadow-[0_0_15px_rgba(112,0,255,0.4)] flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
                <span>{isRetraining ? 'RETRAINING...' : 'START NEURAL RETRAIN'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ingest Document Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-5 rounded-xl border border-cyan-500/40 bg-[#05080cee] shadow-[0_0_30px_rgba(0,242,255,0.2)] space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-widest uppercase">
                  INGEST DATASET / DOCUMENT SHARDS
                </h3>
              </div>
              <button onClick={() => setShowIngestModal(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleIngestDocument} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">DOCUMENT TITLE / TOPIC:</label>
                <input
                  type="text"
                  required
                  value={ingestTitle}
                  onChange={(e) => setIngestTitle(e.target.value)}
                  placeholder="e.g. Gaganyaan Propulsion Parameters Dossier"
                  className="w-full bg-[#111122] border border-[#00f2ff33] rounded p-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00f2ff]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">PRIMARY CATEGORY:</label>
                <select
                  value={ingestCategory}
                  onChange={(e) => setIngestCategory(e.target.value as any)}
                  className="w-full bg-[#111122] border border-[#00f2ff33] rounded p-2 text-white focus:outline-none focus:border-[#00f2ff]"
                >
                  <option value="IMPORTANT_FACTS">IMPORTANT FACTS</option>
                  <option value="PROJECTS">PROJECTS</option>
                  <option value="USER_PROFILE">USER PROFILE</option>
                  <option value="PREFERENCES">PREFERENCES</option>
                  <option value="SYSTEM_CONTROL">SYSTEM CONTROL</option>
                  <option value="GOALS">GOALS</option>
                  <option value="CONVERSATION_CONTEXT">CONVERSATION CONTEXT</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">DOCUMENT TEXT / DATA (Automated Chunking):</label>
                <textarea
                  required
                  rows={6}
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                  placeholder="Paste multi-paragraph documentation, technical parameters, research notes, or architectural guidelines..."
                  className="w-full bg-[#111122] border border-[#00f2ff33] rounded p-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00f2ff]"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  Paragraphs separated by blank lines will automatically be parsed into indexed atomic memory nodes.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#00f2ff] text-black font-bold uppercase tracking-wider hover:bg-white transition cursor-pointer"
                >
                  INGEST & ENCODE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-5 rounded-xl border border-[#00f2ff33] bg-[#050508ee] shadow-[0_0_30px_#00f2ff22] space-y-4">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase">
              ENCODE NEW MEMORY ITEM
            </h3>

            <form onSubmit={handleAddMemory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">CATEGORY:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#111122] border border-[#00f2ff33] rounded p-2 text-white focus:outline-none focus:border-[#00f2ff]"
                >
                  <option value="USER_PROFILE">USER PROFILE</option>
                  <option value="PREFERENCES">PREFERENCES</option>
                  <option value="PROJECTS">PROJECTS</option>
                  <option value="SYSTEM_CONTROL">SYSTEM CONTROL</option>
                  <option value="GOALS">GOALS</option>
                  <option value="IMPORTANT_FACTS">IMPORTANT FACTS</option>
                  <option value="CONVERSATION_CONTEXT">CONVERSATION CONTEXT</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">MEMORY TITLE:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Preferred Rocketry Formulas"
                  className="w-full bg-[#111122] border border-[#00f2ff33] rounded p-2 text-white placeholder:text-[#00f2ff44] focus:outline-none focus:border-[#00f2ff]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">CONTENT / STATEMENT:</label>
                <textarea
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter details for A.E.T.H.E.R. to retain for Nishant..."
                  rows={3}
                  className="w-full bg-[#111122] border border-[#00f2ff33] rounded p-2 text-white placeholder:text-[#00f2ff44] focus:outline-none focus:border-[#00f2ff]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 text-[11px]">TAGS (Comma Separated):</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. AI, ROCKETRY, NISHANT"
                  className="w-full bg-[#111122] border border-[#00f2ff33] rounded p-2 text-white placeholder:text-[#00f2ff44] focus:outline-none focus:border-[#00f2ff]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#00f2ff18]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-[#00f2ff22] text-slate-400 hover:text-white cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#00f2ff] text-black font-bold uppercase tracking-wider hover:bg-white transition cursor-pointer"
                >
                  COMMIT TO MEMORY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Cache Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-5 rounded-xl border border-rose-500/40 bg-[#050508ee] shadow-[0_0_30px_rgba(244,63,94,0.3)] space-y-4">
            <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wider">
              CONFIRM MEMORY RESET
            </h3>
            <p className="text-xs text-slate-300">
              Nishant, this will purge auxiliary remembered facts. The primary user profile identity will be preserved. Proceed?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded border border-slate-700 text-slate-400 text-xs cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-1.5 rounded border border-rose-500/50 bg-rose-950 text-rose-200 text-xs font-bold hover:bg-rose-900 cursor-pointer"
              >
                CONFIRM PURGE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
