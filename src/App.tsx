import React, { useState, useEffect, useRef } from 'react';
import {
  AIStatus,
  CommandMode,
  ChatMessage,
  VoiceConfig,
  ClientTelemetry,
  ServerTelemetry,
  MemoryItem,
  ConnectionStatus,
  ImageAttachment,
  AuthenticatedOperator,
} from './types';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { RightTelemetryPanel } from './components/RightTelemetryPanel';
import { AICoreReactor } from './components/AICoreReactor';
import { ChatConsole } from './components/ChatConsole';
import { SystemControlView } from './components/SystemControlView';
import { CodingModeView } from './components/CodingModeView';
import { SpaceModeView } from './components/SpaceModeView';
import { ResearchModeView } from './components/ResearchModeView';
import { ProjectsView } from './components/ProjectsView';
import { GoogleTasksView } from './components/GoogleTasksView';
import { MemoryMatrixView } from './components/MemoryMatrixView';
import { SystemMonitorView } from './components/SystemMonitorView';
import { GPSMapView } from './components/GPSMapView';
import { EvilSpiritsView } from './components/EvilSpiritsView';
import { StartupScreen } from './components/StartupScreen';
import { AuthGateScreen } from './components/AuthGateScreen';
import { SettingsModal } from './components/SettingsModal';
import { QuickActionFloatingMenu } from './components/QuickActionFloatingMenu';
import { CometVisualizerBackground } from './components/CometVisualizerBackground';
import { NeuralPathVisualizer } from './components/NeuralPathVisualizer';
import { GlassHologramLayer, HolographicGlassOverlay } from './components/GlassHologramLayer';
import { HolographicCursor } from './components/HolographicCursor';
import { getClientTelemetry } from './utils/telemetry';
import { playSound, speakText, stopSpeaking, isSpeakingNow } from './utils/audio';
import { OfflineMemoryManager, generateOfflineResponse } from './utils/offlineEngine';
import { getSavedOperatorSession, clearOperatorSession } from './lib/firebase';
import { initScreenWakeLock, subscribeToWakeLock, toggleScreenWakeLock, WakeLockState } from './utils/screenWakeLock';
import { AutonomousRouter } from './utils/autonomousRouter';
import { ResilientVoiceController } from './utils/voiceRecognition';

export default function App() {
  const [authenticatedOperator, setAuthenticatedOperator] = useState<AuthenticatedOperator | null>(
    () => getSavedOperatorSession()
  );
  const [showBootScreen, setShowBootScreen] = useState(true);
  const [currentMode, setCurrentMode] = useState<CommandMode>('home');
  const [status, setStatus] = useState<AIStatus>('IDLE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingProgress, setThinkingProgress] = useState(0);
  const [thinkingStatus, setThinkingStatus] = useState('STANDBY');
  const [isListening, setIsListening] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Offline Engine State
  const [forceOffline, setForceOffline] = useState<boolean>(() => OfflineMemoryManager.isForcedOffline());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(() =>
    !navigator.onLine ? 'DISCONNECTED' : OfflineMemoryManager.isForcedOffline() ? 'OFFLINE_FALLBACK' : 'ONLINE'
  );

  // Telemetry state
  const [clientTelemetry, setClientTelemetry] = useState<ClientTelemetry>({});
  const [serverTelemetry, setServerTelemetry] = useState<ServerTelemetry | null>(null);

  // Memories & Messages (Initialize with local offline memory storage)
  const [memories, setMemories] = useState<MemoryItem[]>(() => OfflineMemoryManager.getLocalMemories());
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'aether',
      text: 'Greetings Nishant. AETHER core hyperintelligence is online and calibrated. All systems—Quantum Physics tutor, ISRO space telemetry, GPS navigation grid, coding architecture, neural memory, and offline resilience engine—are fully operational. Automatic vocal response is enabled. How may I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: 'home',
    },
  ]);

  // Voice Configuration: Automatic vocal response enabled by default, master mute supported
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    voiceName: '',
    autoSpeak: true, // Default to true per user preference: respond with both text and speech automatically
    isMuted: false,
    wakeWordEnabled: true,
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    soundEffects: true,
    alwaysOnScreen: true,
  });

  // Always-On Screen Wake Lock State
  const [wakeLockState, setWakeLockState] = useState<WakeLockState>({
    isActive: false,
    isSupported: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
    mode: 'DISABLED',
  });

  // Initialize and subscribe to Always-On Screen Wake Lock
  useEffect(() => {
    const cleanup = initScreenWakeLock();
    const unsubscribe = subscribeToWakeLock((state) => {
      setWakeLockState(state);
    });

    return () => {
      unsubscribe();
      cleanup();
    };
  }, []);

  const handleToggleWakeLock = async () => {
    if (voiceConfig.soundEffects) playSound('click');
    const newState = await toggleScreenWakeLock();
    setVoiceConfig((prev) => ({ ...prev, alwaysOnScreen: newState }));
  };

  // Real-Time Spoken Interim & Audio Level States
  const [interimSpeechText, setInterimSpeechText] = useState<string>('');
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const handleSendMessageRef = useRef<(text: string, image?: ImageAttachment) => void>(() => {});

  // Listen to browser network connectivity events
  useEffect(() => {
    const handleOnline = () => {
      if (!forceOffline) {
        setConnectionStatus('ONLINE');
        // Sync local memories with remote server
        OfflineMemoryManager.syncWithRemote();
      }
    };
    const handleOffline = () => {
      setConnectionStatus('DISCONNECTED');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [forceOffline]);

  // Toggle force offline simulation
  const handleToggleForceOffline = () => {
    const next = !forceOffline;
    setForceOffline(next);
    OfflineMemoryManager.setForcedOffline(next);
    if (next) {
      setConnectionStatus('OFFLINE_FALLBACK');
    } else {
      setConnectionStatus(navigator.onLine ? 'ONLINE' : 'DISCONNECTED');
      fetchMemories();
    }
  };

  // Poll hardware and server telemetry
  const refreshTelemetry = async () => {
    try {
      const client = await getClientTelemetry();
      setClientTelemetry(client);

      if (!forceOffline && navigator.onLine) {
        const res = await fetch('/api/system/status');
        const data = await res.json();
        if (data.server) {
          setServerTelemetry(data.server);
        }
      }
    } catch (err) {
      console.error('Telemetry refresh error:', err);
    }
  };

  const fetchMemories = async () => {
    try {
      if (!forceOffline && navigator.onLine) {
        const res = await fetch('/api/memory');
        const data = await res.json();
        if (data.memories && Array.isArray(data.memories)) {
          setMemories(data.memories);
          OfflineMemoryManager.saveAllLocalMemories(data.memories);
          return;
        }
      }
      // Fallback to local storage
      const local = OfflineMemoryManager.getLocalMemories();
      setMemories(local);
    } catch {
      const local = OfflineMemoryManager.getLocalMemories();
      setMemories(local);
    }
  };

  useEffect(() => {
    refreshTelemetry();
    fetchMemories();
    const interval = setInterval(refreshTelemetry, 20000);
    return () => clearInterval(interval);
  }, [forceOffline]);

  // Synchronize handleSendMessageRef so async speech recognition callbacks always use the latest handler
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  });

  // Resilient Multi-Engine Voice Recognition Setup (Web Speech API + Gemini Multimodal Audio Fallback)
  useEffect(() => {
    const voiceCtrl = ResilientVoiceController.getInstance();
    voiceCtrl.setCallbacks({
      onStart: () => {
        stopSpeaking();
        setIsListening(true);
        setStatus('LISTENING');
        if (voiceConfig.soundEffects) playSound('pulse');
      },
      onInterim: (text: string) => {
        setInterimSpeechText(text);
      },
      onFinal: (text: string) => {
        setInterimSpeechText('');
        setIsListening(false);
        if (text && text.trim()) {
          if (handleSendMessageRef.current) {
            handleSendMessageRef.current(text.trim());
          }
        }
      },
      onError: (errMsg: string, code?: string) => {
        console.warn('[AETHER Voice Engine Error]:', errMsg, code);
        setIsListening(false);
        setStatus('IDLE');
        if (code === 'not-allowed') {
          const noticeMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            sender: 'system',
            text: 'Microphone permission was denied. Please allow microphone access in your browser to speak commands directly to A.E.T.H.E.R.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, noticeMsg]);
        }
      },
      onVolumeChange: (vol: number) => {
        setVoiceVolume(vol);
      },
      onEnd: () => {
        setIsListening(false);
        setStatus((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
        setInterimSpeechText('');
      },
    });
  }, [voiceConfig.soundEffects]);

  const toggleVoiceListening = async () => {
    stopSpeaking();
    const voiceCtrl = ResilientVoiceController.getInstance();

    if (isListening || voiceCtrl.isListening()) {
      voiceCtrl.stop();
      setIsListening(false);
      setStatus('IDLE');
      setInterimSpeechText('');
    } else {
      setIsListening(true);
      setStatus('LISTENING');
      const started = await voiceCtrl.start();
      if (!started) {
        setIsListening(false);
        setStatus('IDLE');
      }
    }
  };

  // Main chat communication handler with autonomous intent routing, offline logic fallback, auto-TTS and barge-in memory retention
  const handleSendMessage = async (text: string, image?: ImageAttachment) => {
    if ((!text.trim() && !image) || isProcessing) return;

    // Immediately stop previous speech if still talking (interruption / barge-in support)
    stopSpeaking();

    // 1. Autonomous Zero-Menu Intent & Protocol Analysis
    const route = AutonomousRouter.analyzeAndRoute(text, currentMode);

    // 2. Automatic System / View Navigation (Zero manual menus needed)
    if (route.autoNavigatedMode && route.autoNavigatedMode !== currentMode) {
      setCurrentMode(route.autoNavigatedMode);
    }

    // 3. Direct Autonomous Subsystem Actions
    if (route.directAction === 'TOGGLE_WAKE_LOCK') {
      handleToggleWakeLock();
    } else if (route.directAction === 'RUN_DIAGNOSTICS' || route.directAction === 'POLL_SENSORS') {
      refreshTelemetry();
    }

    const effectiveText = (route.cleanedCommand || text).trim();

    // Add user message with autonomous route tags
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim() || (image ? `[Optical Telemetry Frame Attached]` : ''),
      image: image,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      autonomousRoute: {
        intent: route.intent,
        subsystem: route.subsystem,
        protocol: route.protocol,
        executionChain: route.executionChain,
      },
    };

    setMessages((prev) => [...prev, userMsg]);
    
    // Save to persistent storage buffer for continuous learning & retraining
    OfflineMemoryManager.savePersistentChatMessage(userMsg);
    // Real-time automatic extraction of facts, preferences, tasks, and data
    OfflineMemoryManager.autoExtractMemoryFromMessage(userMsg.text, route.autoNavigatedMode || currentMode);

    setIsProcessing(true);
    setStatus('PROCESSING');
    setThinkingProgress(15);
    setThinkingStatus(
      image
        ? 'Ingesting optical tensor frame...'
        : `[${route.subsystem}] Engaging ${route.protocol}...`
    );

    if (voiceConfig.soundEffects) playSound('click');

    // Progress animation milestones
    const progressTimer = setInterval(() => {
      setThinkingProgress((prev) => {
        if (prev < 40) {
          setThinkingStatus(
            image
              ? 'Segmenting optical visual vectors...'
              : `[${route.intent}] Multi-system synthesis...`
          );
          return prev + 15;
        } else if (prev < 75) {
          setThinkingStatus(image ? 'Multimodal visual token synthesis...' : 'Synthesizing autonomous briefing...');
          return prev + 12;
        } else if (prev < 92) {
          setThinkingStatus('Verifying scientific consistency & formatting...');
          return prev + 4;
        }
        return prev;
      });
    }, 250);

    const isOfflineActive = forceOffline || !navigator.onLine;

    // Direct local Offline Logic Engine if offline mode or disconnected
    if (isOfflineActive) {
      setTimeout(() => {
        clearInterval(progressTimer);
        setThinkingProgress(100);
        setThinkingStatus('Local State Synthesized');

        const localMemories = OfflineMemoryManager.getLocalMemories();
        const targetMode = route.autoNavigatedMode || currentMode;
        const offlineResult = generateOfflineResponse(effectiveText || text, targetMode, localMemories, messages, image);
        const fallbackText = offlineResult.response;

        setStatus('RESPONDING');
        const assistantMsg: ChatMessage = {
          id: `aether-offline-${Date.now()}`,
          sender: 'aether',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: targetMode,
          sources: offlineResult.sources,
          isOffline: true,
          autonomousRoute: {
            intent: route.intent,
            subsystem: route.subsystem,
            protocol: route.protocol,
          },
        };

        setMessages((prev) => [...prev, assistantMsg]);
        if (voiceConfig.soundEffects) playSound('chime');

        if (!voiceConfig.isMuted && voiceConfig.autoSpeak) {
          speakText(fallbackText, {
            voiceName: voiceConfig.voiceName,
            rate: voiceConfig.rate,
            pitch: voiceConfig.pitch,
            volume: voiceConfig.volume,
            onEnd: () => setStatus('IDLE'),
            onError: () => setStatus('IDLE'),
          });
        } else {
          setTimeout(() => setStatus('IDLE'), 600);
        }
        setIsProcessing(false);
      }, 500);
      return;
    }

    try {
      // Build conversation history payload preserving all past commands & responses
      const history = messages
        .filter((m) => m.sender !== 'system')
        .slice(-10)
        .map((m) => ({
          sender: m.sender,
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text,
        }));

      const targetMode = route.autoNavigatedMode || currentMode;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: effectiveText || (image ? 'Analyze this optical frame and provide detailed reasoning.' : ''),
          image: image,
          mode: targetMode,
          history,
          conversationHistory: history,
        }),
      });

      if (!res.ok) {
        throw new Error(`API status ${res.status}`);
      }

      const data = await res.json();
      clearInterval(progressTimer);
      setThinkingProgress(100);
      setThinkingStatus('Ready');

      const responseContent = data.response || data.reply || data.message || data.text;

      if (responseContent) {
        setStatus('RESPONDING');
        const assistantMsg: ChatMessage = {
          id: `aether-${Date.now()}`,
          sender: 'aether',
          text: responseContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: targetMode,
          sources: data.sources || [],
          autonomousRoute: {
            intent: route.intent,
            subsystem: route.subsystem,
            protocol: route.protocol,
          },
        };

        setMessages((prev) => [...prev, assistantMsg]);
        OfflineMemoryManager.savePersistentChatMessage(assistantMsg);
        if (voiceConfig.soundEffects) playSound('chime');

        // Automatic Text-to-Speech
        if (!voiceConfig.isMuted && voiceConfig.autoSpeak) {
          speakText(responseContent, {
            voiceName: voiceConfig.voiceName,
            rate: voiceConfig.rate,
            pitch: voiceConfig.pitch,
            volume: voiceConfig.volume,
            onEnd: () => setStatus('IDLE'),
            onError: () => setStatus('IDLE'),
          });
        } else {
          setTimeout(() => setStatus('IDLE'), 600);
        }

        // Refresh memory cache in case Gemini triggered memory storage
        fetchMemories();
      } else {
        throw new Error(data.error || 'Failed to receive response from AETHER.');
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      console.warn('API communication error, engaging Offline Logic Engine:', err);
      
      // Graceful offline fallback on network or API failure
      setConnectionStatus('OFFLINE_FALLBACK');
      const localMemories = OfflineMemoryManager.getLocalMemories();
      const targetMode = route.autoNavigatedMode || currentMode;
      const offlineResult = generateOfflineResponse(effectiveText || text, targetMode, localMemories, messages, image);
      const fallbackText = offlineResult.response;

      setStatus('RESPONDING');
      if (voiceConfig.soundEffects) playSound('chime');

      const fallbackMsg: ChatMessage = {
        id: `aether-fallback-${Date.now()}`,
        sender: 'aether',
        text: `${fallbackText}\n\n*(Note: Uplink to cloud API timed out. Response synthesized via AETHER Local Heuristic State Engine.)*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: targetMode,
        sources: offlineResult.sources,
        isOffline: true,
        autonomousRoute: {
          intent: route.intent,
          subsystem: route.subsystem,
          protocol: route.protocol,
        },
      };

      setMessages((prev) => [...prev, fallbackMsg]);
      OfflineMemoryManager.savePersistentChatMessage(fallbackMsg);

      if (!voiceConfig.isMuted && voiceConfig.autoSpeak) {
        speakText(fallbackText, {
          voiceName: voiceConfig.voiceName,
          rate: voiceConfig.rate,
          pitch: voiceConfig.pitch,
          volume: voiceConfig.volume,
          onEnd: () => setStatus('IDLE'),
          onError: () => setStatus('IDLE'),
        });
      } else {
        setTimeout(() => setStatus('IDLE'), 600);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerateLast = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.text, lastUserMsg.image);
    }
  };

  const handleClearMessages = () => {
    stopSpeaking();
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'aether',
        text: 'Neural conversation buffer cleared. Ready for your next directive, Nishant.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: currentMode,
      },
    ]);
  };

  const handleQuickCommand = (cmd: string) => {
    if (currentMode !== 'home' && currentMode !== 'chat') setCurrentMode('home');
    handleSendMessage(cmd);
  };

  const handleOperatorAuthenticated = (operator: AuthenticatedOperator) => {
    setAuthenticatedOperator(operator);
    setShowBootScreen(true);
  };

  const handleLockGateway = () => {
    clearOperatorSession();
    setAuthenticatedOperator(null);
    setShowBootScreen(true);
    if (voiceConfig.soundEffects) playSound('error');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050508] text-[#00f2ff] font-cyber selection:bg-[#7000ff] selection:text-white overflow-hidden relative perspective-stage preserve-3d">
      {/* 3D Deep Space & Background Holographic Layer */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden z-0"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'translateZ(-60px) scale(1.06)',
        }}
      >
        <CometVisualizerBackground
          status={status}
          isListening={isListening}
          currentMode={currentMode}
          cometDensity="MEDIUM"
          interactive={false}
        />
        <NeuralPathVisualizer
          thinkingProgress={thinkingProgress}
          thinkingStatus={thinkingStatus}
          status={status}
          currentMode={currentMode}
        />
        <div
          className="absolute inset-0 opacity-25"
          style={{ background: 'radial-gradient(circle at 50% 50%, #1e266d 0%, transparent 70%)' }}
        />
        <div className="absolute inset-0 opacity-[0.04] bg-scanlines-immersive" />
        <div className="absolute inset-0 bg-holo-grid opacity-25" />
      </div>

      {/* Optical Glass Hologram Specular Sheen & Corner Laser Brackets */}
      <HolographicGlassOverlay intensity="medium" />

      {/* Firebase Authentication & Biometric Gate Screen */}
      {!authenticatedOperator ? (
        <AuthGateScreen
          onAuthenticated={handleOperatorAuthenticated}
          soundEffects={voiceConfig.soundEffects}
        />
      ) : showBootScreen ? (
        <StartupScreen
          soundEffects={voiceConfig.soundEffects}
          operator={authenticatedOperator}
          onComplete={() => setShowBootScreen(false)}
        />
      ) : null}

      {/* Top Header HUD Bar - Surface Glass Hologram Layer */}
      <GlassHologramLayer depth="surface" className="z-30 shrink-0">
        <TopBar
          status={status}
          voiceConfig={voiceConfig}
          setVoiceConfig={setVoiceConfig}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleTelemetry={() => setIsTelemetryOpen(!isTelemetryOpen)}
          showTelemetry={isTelemetryOpen}
          connectionStatus={connectionStatus}
          forceOffline={forceOffline}
          onToggleForceOffline={handleToggleForceOffline}
          operator={authenticatedOperator}
          onLockGateway={handleLockGateway}
          wakeLockState={wakeLockState}
          onToggleWakeLock={handleToggleWakeLock}
        />
      </GlassHologramLayer>

      {/* Main Body Workspace - Holographic Preserved-3D Spatial Grid */}
      <div
        className="flex-1 flex overflow-hidden relative z-10"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Holographic Left Sidebar */}
        <GlassHologramLayer depth="hud" className="h-full flex flex-col z-20 shrink-0">
          <Sidebar
            currentMode={currentMode}
            onSelectMode={(mode) => {
              if (mode === 'settings') {
                setIsSettingsOpen(true);
              } else {
                if (voiceConfig.soundEffects) playSound('click');
                setCurrentMode(mode);
              }
            }}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            soundEffects={voiceConfig.soundEffects}
          />
        </GlassHologramLayer>

        {/* Dynamic Center Work Area */}
        <main
          className="flex-1 flex flex-col overflow-y-auto relative bg-[#05050880] backdrop-blur-[6px] transition-all"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(10px)',
          }}
        >
          {(currentMode === 'home' || currentMode === 'chat') && (
            <div className="flex-1 flex flex-col p-3 sm:p-4 gap-4 max-w-7xl mx-auto w-full preserve-3d">
              {/* Circular Holographic AI Core & Quick Actions */}
              {currentMode === 'home' && (
                <GlassHologramLayer depth="floating" className="w-full">
                  <AICoreReactor
                    status={status}
                    onQuickCommand={handleQuickCommand}
                    onToggleVoice={toggleVoiceListening}
                    isListening={isListening}
                    interimTranscript={interimSpeechText}
                    voiceVolume={voiceVolume}
                  />
                </GlassHologramLayer>
              )}

              {/* Holographic Neural Conversation Console */}
              <GlassHologramLayer depth="hud" className="flex-1 min-h-[420px]">
                <ChatConsole
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onClearMessages={handleClearMessages}
                  onRegenerate={handleRegenerateLast}
                  isProcessing={isProcessing}
                  thinkingProgress={thinkingProgress}
                  thinkingStatus={thinkingStatus}
                  isListening={isListening}
                  interimTranscript={interimSpeechText}
                  voiceVolume={voiceVolume}
                  onToggleVoice={toggleVoiceListening}
                  currentMode={currentMode}
                  voiceConfig={voiceConfig}
                  setVoiceConfig={setVoiceConfig}
                  isOfflineActive={forceOffline || connectionStatus === 'OFFLINE_FALLBACK' || connectionStatus === 'DISCONNECTED'}
                />
              </GlassHologramLayer>
            </div>
          )}

          {currentMode === 'control' && (
            <GlassHologramLayer depth="hud" className="flex-1 flex flex-col">
              <SystemControlView
                onSendMessage={handleSendMessage}
                soundEffects={voiceConfig.soundEffects}
                onRefreshTelemetry={refreshTelemetry}
              />
            </GlassHologramLayer>
          )}

          {currentMode === 'coding' && (
            <GlassHologramLayer depth="hud" className="flex-1 flex flex-col">
              <CodingModeView
                onAskCode={handleSendMessage}
                soundEffects={voiceConfig.soundEffects}
              />
            </GlassHologramLayer>
          )}

          {currentMode === 'space' && (
            <GlassHologramLayer depth="hud" className="flex-1 flex flex-col">
              <SpaceModeView
                onAskSpace={handleSendMessage}
                soundEffects={voiceConfig.soundEffects}
              />
            </GlassHologramLayer>
          )}

          {currentMode === 'maps' && (
            <GlassHologramLayer depth="hud" className="flex-1 flex flex-col">
              <GPSMapView onQuickCommand={handleQuickCommand} />
            </GlassHologramLayer>
          )}

          {currentMode === 'spirits' && (
            <GlassHologramLayer depth="hud" className="flex-1 flex flex-col">
              <EvilSpiritsView
                onAskSpiritDialogue={handleSendMessage}
                soundEffects={voiceConfig.soundEffects}
              />
            </GlassHologramLayer>
          )}

          {currentMode === 'research' && (
            <GlassHologramLayer depth="hud" className="flex-1 flex flex-col">
              <ResearchModeView
                onAskResearch={handleSendMessage}
                soundEffects={voiceConfig.soundEffects}
              />
            </GlassHologramLayer>
          )}

          {currentMode === 'projects' && (
            <GlassHologramLayer depth="hud" className="flex-1 flex flex-col">
              <ProjectsView
                onAskProject={handleSendMessage}
                soundEffects={voiceConfig.soundEffects}
              />
            </GlassHologramLayer>
          )}

          {currentMode === 'tasks' && (
            <GlassHologramLayer depth="hud" className="flex-1 flex flex-col">
              <GoogleTasksView
                onAskTasks={handleSendMessage}
                soundEffects={voiceConfig.soundEffects}
              />
            </GlassHologramLayer>
          )}

          {currentMode === 'memory' && (
            <GlassHologramLayer depth="hud" className="flex-1 flex flex-col">
              <MemoryMatrixView
                onAskMemory={handleSendMessage}
                soundEffects={voiceConfig.soundEffects}
                messages={messages}
              />
            </GlassHologramLayer>
          )}

          {currentMode === 'system' && (
            <GlassHologramLayer depth="hud" className="flex-1 flex flex-col">
              <SystemMonitorView
                clientTelemetry={clientTelemetry}
                serverTelemetry={serverTelemetry}
                onRefreshTelemetry={refreshTelemetry}
                soundEffects={voiceConfig.soundEffects}
              />
            </GlassHologramLayer>
          )}
        </main>

        {/* Collapsible Right Telemetry HUD Panel */}
        {isTelemetryOpen && (
          <GlassHologramLayer depth="floating" className="h-full z-30 shrink-0">
            <RightTelemetryPanel
              clientTelemetry={clientTelemetry}
              serverTelemetry={serverTelemetry}
              memories={memories}
              isOpen={isTelemetryOpen}
              onClose={() => setIsTelemetryOpen(false)}
              connectionStatus={connectionStatus}
              forceOffline={forceOffline}
            />
          </GlassHologramLayer>
        )}
      </div>

      {/* Context-Aware Quick Action Floating Menu */}
      <GlassHologramLayer depth="floating" className="z-40">
        <QuickActionFloatingMenu
          currentMode={currentMode}
          onSendMessage={handleSendMessage}
          onToggleVoice={toggleVoiceListening}
          isListening={isListening}
          soundEffects={voiceConfig.soundEffects}
          onRefreshTelemetry={refreshTelemetry}
          onClearMessages={handleClearMessages}
          onSelectMode={(mode) => {
            if (voiceConfig.soundEffects) playSound('click');
            setCurrentMode(mode);
          }}
        />
      </GlassHologramLayer>

      {/* Encrypted Stream Footer Watermark */}
      <div className="absolute bottom-2 right-4 text-[8px] font-mono opacity-30 flex items-center space-x-2 uppercase pointer-events-none z-30 select-none text-[#00f2ff]">
        <span>Encrypted Stream Active</span>
        <span className="w-1 h-1 bg-[#00f2ff] rounded-full shadow-[0_0_4px_#00f2ff]" />
        <span>P2P Protocol 7.4.2</span>
      </div>

      {/* Custom 3D Mouse-Follower Floating Cursor */}
      <HolographicCursor />

      {/* Settings & Voice Calibration Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        voiceConfig={voiceConfig}
        onUpdateConfig={(cfg) => setVoiceConfig((prev) => ({ ...prev, ...cfg }))}
        wakeLockState={wakeLockState}
        onToggleWakeLock={handleToggleWakeLock}
      />
    </div>
  );
}
