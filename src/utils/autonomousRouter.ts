/**
 * A.E.T.H.E.R. — Voice-First Autonomous Control & Intent Routing Engine
 * 
 * Implements the Zero-Menu Principle:
 * VOICE COMMAND → INTENT ANALYSIS → AUTOMATIC SYSTEM SELECTION → PROTOCOL SELECTION → EXECUTION → VERBAL RESPONSE
 */

import { CommandMode } from '../types';

export type SubsystemType =
  | 'CognitiveSystem'
  | 'KnowledgeSystem'
  | 'ResearchSystem'
  | 'VisionSystem'
  | 'VoiceSystem'
  | 'AutomationSystem'
  | 'ComputerControlSystem'
  | 'DevelopmentSystem'
  | 'SecuritySystem'
  | 'SpectralDefenseSystem'
  | 'HardwareControlSystem';

export type ProtocolType =
  | 'COGNITIVE_REASONING_PROTOCOL'
  | 'KNOWLEDGE_RETRIEVAL_PROTOCOL'
  | 'LIVE_RESEARCH_PROTOCOL'
  | 'VISION_ANALYSIS_PROTOCOL'
  | 'VOICE_CONTROL_PROTOCOL'
  | 'AUTOMATION_PROTOCOL'
  | 'HUD_NAVIGATION_PROTOCOL'
  | 'CODING_PROTOCOL'
  | 'SECURITY_AUDIT_PROTOCOL'
  | 'SPECTRAL_DEFENSE_PROTOCOL'
  | 'HARDWARE_CONTROL_PROTOCOL'
  | 'ORBITAL_TELEMETRY_PROTOCOL';

export interface AutonomousRouteResult {
  rawCommand: string;
  cleanedCommand: string;
  intent: string;
  subsystem: SubsystemType;
  protocol: ProtocolType;
  targetObject?: string;
  autoNavigatedMode?: CommandMode;
  directAction?: 'TOGGLE_WAKE_LOCK' | 'TOGGLE_MUTE' | 'CLEAR_MESSAGES' | 'RUN_DIAGNOSTICS' | 'SWITCH_VIEW' | 'POLL_SENSORS' | null;
  directActionParam?: any;
  executionChain: string[];
  requiresConfirmation: boolean;
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
}

export class AutonomousRouter {
  /**
   * Cleans wake words like "Hey Aether", "Aether", "OK Aether" from user command
   */
  static cleanWakeWord(text: string): { cleaned: string; hadWakeWord: boolean } {
    if (!text) return { cleaned: '', hadWakeWord: false };
    const trimmed = text.trim();
    const match = trimmed.match(/^(?:hey|ok|hi|hello|yo)?\s*(?:aether|ether|ae-ther|a\.e\.t\.h\.e\.r\.?)\s*[,:\-—]?\s*(.*)/i);
    if (match) {
      return {
        cleaned: (match[1] || '').trim(),
        hadWakeWord: true,
      };
    }
    return { cleaned: trimmed, hadWakeWord: false };
  }

  /**
   * Master Intent Analyzer & Protocol Selector
   */
  static analyzeAndRoute(input: string, currentMode?: CommandMode): AutonomousRouteResult {
    const { cleaned } = this.cleanWakeWord(input);
    const text = (cleaned || input).toLowerCase().trim();
    const raw = input.trim();

    // 1. HARDWARE / ALWAYS-ON SCREEN / SLEEP MODE INHIBITOR INTENTS
    if (
      text.includes('screen') ||
      text.includes('wake lock') ||
      text.includes('sleep mode') ||
      text.includes('keep awake') ||
      text.includes('turn on screen') ||
      text.includes('display sleep') ||
      text.includes('dimming')
    ) {
      return {
        rawCommand: raw,
        cleanedCommand: cleaned || raw,
        intent: 'SCREEN_SLEEP_INHIBITION',
        subsystem: 'HardwareControlSystem',
        protocol: 'HARDWARE_CONTROL_PROTOCOL',
        targetObject: 'Display Wake Lock Sentinel',
        directAction: text.includes('turn on') || text.includes('enable') || text.includes('keep') || text.includes('lock') ? 'TOGGLE_WAKE_LOCK' : null,
        executionChain: [
          'VOICE INPUT RECEIVED',
          'INTENT CLASSIFIED: HARDWARE_DISPLAY_CONTROL',
          'SUBSYSTEM: HardwareControlSystem',
          'PROTOCOL: HARDWARE_CONTROL_PROTOCOL',
          'ACTION: ENGAGE_W3C_SCREEN_WAKE_LOCK',
          'STATUS: DISPLAY SLEEP INHIBITED',
        ],
        requiresConfirmation: false,
        priority: 'NORMAL',
      };
    }

    // 2. PARANORMAL & EVIL SPIRITS OCCULT DEFENSE INTENTS
    if (
      text.includes('spirit') ||
      text.includes('demon') ||
      text.includes('ghost') ||
      text.includes('exorcism') ||
      text.includes('paranormal') ||
      text.includes('azazel') ||
      text.includes('lilith') ||
      text.includes('beelzebub') ||
      text.includes('moros') ||
      text.includes('evp') ||
      text.includes('containment vault')
    ) {
      const isNav = text.startsWith('open') || text.startsWith('show') || text.startsWith('switch to') || text.startsWith('launch');
      return {
        rawCommand: raw,
        cleanedCommand: cleaned || raw,
        intent: 'SPECTRAL_DEFENSE',
        subsystem: 'SpectralDefenseSystem',
        protocol: 'SPECTRAL_DEFENSE_PROTOCOL',
        targetObject: 'Demonic Containment Vault',
        autoNavigatedMode: isNav ? 'spirits' : undefined,
        executionChain: [
          'VOICE INPUT RECEIVED',
          'INTENT CLASSIFIED: PARANORMAL_THREAT_ANALYSIS',
          'SUBSYSTEM: SpectralDefenseSystem',
          'PROTOCOL: SPECTRAL_DEFENSE_PROTOCOL',
          'TELEMETRY: SCANNING EMF & THERMAL COLDS POTS',
          'ACTION: ENGAGE SOLOMONIC WARDS & EVIL SPIRITS VAULT',
        ],
        requiresConfirmation: false,
        priority: 'HIGH',
      };
    }

    // 3. SPACE / ORBITAL TELEMETRY INTENTS (ISRO, NASA, SpaceX, rockets, orbits)
    if (
      text.includes('space') ||
      text.includes('isro') ||
      text.includes('nasa') ||
      text.includes('spacex') ||
      text.includes('gaganyaan') ||
      text.includes('chandrayaan') ||
      text.includes('artemis') ||
      text.includes('starship') ||
      text.includes('orbit') ||
      text.includes('satellite') ||
      text.includes('astronomy') ||
      text.includes('rocket launch') ||
      text.includes('aditya-l1') ||
      text.includes('nisar')
    ) {
      const isNav = text.startsWith('open') || text.startsWith('show') || text.startsWith('switch to') || text.startsWith('launch');
      return {
        rawCommand: raw,
        cleanedCommand: cleaned || raw,
        intent: 'ORBITAL_TELEMETRY_RESEARCH',
        subsystem: 'KnowledgeSystem',
        protocol: 'ORBITAL_TELEMETRY_PROTOCOL',
        targetObject: 'Deep Space Mission Tracker',
        autoNavigatedMode: isNav ? 'space' : undefined,
        executionChain: [
          'VOICE INPUT RECEIVED',
          'INTENT CLASSIFIED: AEROSPACE_EXPLORATION',
          'SUBSYSTEM: KnowledgeSystem',
          'PROTOCOL: ORBITAL_TELEMETRY_PROTOCOL',
          'TELEMETRY: TLE EPHEMERIS & MISSION PROPAGATION',
          'ACTION: RETRIEVE LIVE FLIGHT DATA & DISPATCH BRIEFING',
        ],
        requiresConfirmation: false,
        priority: 'NORMAL',
      };
    }

    // 4. DEVELOPMENT & CODING INTENTS (Python, TypeScript, React, algorithms, debug)
    if (
      text.includes('write code') ||
      text.includes('write a program') ||
      text.includes('write a python') ||
      text.includes('write a function') ||
      text.includes('typescript') ||
      text.includes('javascript') ||
      text.includes('refactor') ||
      text.includes('debug') ||
      text.includes('algorithm') ||
      text.includes('coding') ||
      text.includes('compiler') ||
      text.includes('git repo') ||
      text.startsWith('code ') ||
      text.includes('open coding') ||
      text.includes('show ide')
    ) {
      const isNav = text.startsWith('open') || text.startsWith('show') || text.startsWith('switch to') || text.startsWith('launch');
      return {
        rawCommand: raw,
        cleanedCommand: cleaned || raw,
        intent: 'SOFTWARE_SYNTHESIS',
        subsystem: 'DevelopmentSystem',
        protocol: 'CODING_PROTOCOL',
        targetObject: 'Interactive Coding IDE',
        autoNavigatedMode: isNav ? 'coding' : undefined,
        executionChain: [
          'VOICE INPUT RECEIVED',
          'INTENT CLASSIFIED: CODE_GENERATION_AND_ANALYSIS',
          'SUBSYSTEM: DevelopmentSystem',
          'PROTOCOL: CODING_PROTOCOL',
          'ACTION: SYNTHESIZE PRODUCTION-READY CODE & UNIT SCHEMAS',
        ],
        requiresConfirmation: false,
        priority: 'NORMAL',
      };
    }

    // 5. GPS & NAVIGATION INTENTS (location, map, coordinates, lat long, place)
    if (
      text.includes('where am i') ||
      text.includes('location') ||
      text.includes('gps') ||
      text.includes('navigation') ||
      text.includes('map') ||
      text.includes('coordinates') ||
      text.includes('open map') ||
      text.includes('show map')
    ) {
      const isNav = text.startsWith('open') || text.startsWith('show') || text.startsWith('switch to') || text.startsWith('launch') || text.includes('where am i');
      return {
        rawCommand: raw,
        cleanedCommand: cleaned || raw,
        intent: 'GEOLOCATION_TRACKING',
        subsystem: 'ComputerControlSystem',
        protocol: 'HUD_NAVIGATION_PROTOCOL',
        targetObject: 'GPS Satellite Constellation Grid',
        autoNavigatedMode: isNav ? 'maps' : undefined,
        executionChain: [
          'VOICE INPUT RECEIVED',
          'INTENT CLASSIFIED: GEOLOCATION_NAVIGATION',
          'SUBSYSTEM: ComputerControlSystem',
          'PROTOCOL: HUD_NAVIGATION_PROTOCOL',
          'SENSORS: LOCK NAVIC/GPS/GLONASS CONSTELLATION',
          'ACTION: RENDER COORDINATES & MAP PROJECTION',
        ],
        requiresConfirmation: false,
        priority: 'NORMAL',
      };
    }

    // 6. SECURITY & BIOMETRIC LOGS INTENTS (WebAuthn, security logs, access history)
    if (
      text.includes('security log') ||
      text.includes('biometric log') ||
      text.includes('passkey') ||
      text.includes('auth history') ||
      text.includes('who accessed') ||
      text.includes('login attempts') ||
      text.includes('security monitor')
    ) {
      const isNav = text.startsWith('open') || text.startsWith('show') || text.startsWith('switch to') || text.startsWith('launch');
      return {
        rawCommand: raw,
        cleanedCommand: cleaned || raw,
        intent: 'SECURITY_AUDIT',
        subsystem: 'SecuritySystem',
        protocol: 'SECURITY_AUDIT_PROTOCOL',
        targetObject: 'Biometric WebAuthn Audit Ledger',
        autoNavigatedMode: isNav ? 'system' : undefined,
        executionChain: [
          'VOICE INPUT RECEIVED',
          'INTENT CLASSIFIED: SECURITY_AUDIT_VERIFICATION',
          'SUBSYSTEM: SecuritySystem',
          'PROTOCOL: SECURITY_AUDIT_PROTOCOL',
          'ACTION: RETRIEVE TIMESTAMPED BIOMETRIC PASSKEY LEDGER',
        ],
        requiresConfirmation: false,
        priority: 'HIGH',
      };
    }

    // 7. SYSTEM CONTROL & ROOT OVERRIDES INTENTS
    if (
      text.includes('system control') ||
      text.includes('kernel') ||
      text.includes('hyperparameter') ||
      text.includes('root override') ||
      text.includes('open control') ||
      text.includes('show control') ||
      text.includes('superuser settings')
    ) {
      const isNav = text.startsWith('open') || text.startsWith('show') || text.startsWith('switch to') || text.startsWith('launch');
      return {
        rawCommand: raw,
        cleanedCommand: cleaned || raw,
        intent: 'ROOT_SYSTEM_RECONFIGURATION',
        subsystem: 'ComputerControlSystem',
        protocol: 'HUD_NAVIGATION_PROTOCOL',
        targetObject: 'AETHER Root Kernel Matrix',
        autoNavigatedMode: isNav ? 'control' : undefined,
        executionChain: [
          'VOICE INPUT RECEIVED',
          'INTENT CLASSIFIED: ROOT_SYSTEM_CONTROL',
          'SUBSYSTEM: ComputerControlSystem',
          'PROTOCOL: HUD_NAVIGATION_PROTOCOL',
          'CLEARANCE: ROOT SUPERUSER VERIFIED',
          'ACTION: ENGAGE LIVE SYSTEM CONTROL CONSOLE',
        ],
        requiresConfirmation: false,
        priority: 'HIGH',
      };
    }

    // 8. PROJECTS & OBJECTIVES INTENTS
    if (
      text.includes('project dashboard') ||
      text.includes('my projects') ||
      text.includes('open projects') ||
      text.includes('show projects') ||
      text.includes('mission control') ||
      text.includes('tasks') ||
      text.includes('google tasks') ||
      text.includes('deadlines')
    ) {
      const isNav = text.startsWith('open') || text.startsWith('show') || text.startsWith('switch to') || text.startsWith('launch');
      const isTasks = text.includes('google tasks') || text.includes('task list');
      return {
        rawCommand: raw,
        cleanedCommand: cleaned || raw,
        intent: 'PROJECT_AND_TASK_MANAGEMENT',
        subsystem: 'AutomationSystem',
        protocol: 'AUTOMATION_PROTOCOL',
        targetObject: isTasks ? 'Google Tasks Matrix' : 'Projects Mission Control',
        autoNavigatedMode: isNav ? (isTasks ? 'tasks' : 'projects') : undefined,
        executionChain: [
          'VOICE INPUT RECEIVED',
          'INTENT CLASSIFIED: PROJECT_TRIAGE_AND_ORCHESTRATION',
          'SUBSYSTEM: AutomationSystem',
          'PROTOCOL: AUTOMATION_PROTOCOL',
          'ACTION: SYNCHRONIZE ACTIVE SPRINT ROADMAP & OBJECTIVES',
        ],
        requiresConfirmation: false,
        priority: 'NORMAL',
      };
    }

    // 9. MEMORY MATRIX & KNOWLEDGE RETRIEVAL INTENTS
    if (
      text.includes('memory matrix') ||
      text.includes('my memories') ||
      text.includes('open memory') ||
      text.includes('show memories') ||
      text.includes('what do you remember')
    ) {
      const isNav = text.startsWith('open') || text.startsWith('show') || text.startsWith('switch to');
      return {
        rawCommand: raw,
        cleanedCommand: cleaned || raw,
        intent: 'NEURAL_MEMORY_EXPLORATION',
        subsystem: 'CognitiveSystem',
        protocol: 'COGNITIVE_REASONING_PROTOCOL',
        targetObject: 'Neural Long-Term Memory Matrix',
        autoNavigatedMode: isNav ? 'memory' : undefined,
        executionChain: [
          'VOICE INPUT RECEIVED',
          'INTENT CLASSIFIED: LONG_TERM_MEMORY_QUERY',
          'SUBSYSTEM: CognitiveSystem',
          'PROTOCOL: COGNITIVE_REASONING_PROTOCOL',
          'ACTION: RETRIEVE STORED KNOWLEDGE SHARDS',
        ],
        requiresConfirmation: false,
        priority: 'NORMAL',
      };
    }

    // 10. SYSTEM MONITOR & HARDWARE SENSORS INTENTS
    if (
      text.includes('system monitor') ||
      text.includes('hardware status') ||
      text.includes('open monitor') ||
      text.includes('show monitor') ||
      text.includes('run diagnostics') ||
      text.includes('sensor status')
    ) {
      const isNav = text.startsWith('open') || text.startsWith('show') || text.startsWith('switch to');
      return {
        rawCommand: raw,
        cleanedCommand: cleaned || raw,
        intent: 'SYSTEM_HARDWARE_DIAGNOSTICS',
        subsystem: 'ComputerControlSystem',
        protocol: 'HARDWARE_CONTROL_PROTOCOL',
        targetObject: 'System Telemetry & Hardware Sensors',
        autoNavigatedMode: isNav ? 'system' : undefined,
        directAction: text.includes('run diagnostics') ? 'RUN_DIAGNOSTICS' : text.includes('poll sensors') ? 'POLL_SENSORS' : null,
        executionChain: [
          'VOICE INPUT RECEIVED',
          'INTENT CLASSIFIED: HARDWARE_TELEMETRY_INSPECTION',
          'SUBSYSTEM: ComputerControlSystem',
          'PROTOCOL: HARDWARE_CONTROL_PROTOCOL',
          'ACTION: EXECUTE SENSOR POLLING & SUBSYSTEM DIAGNOSTICS',
        ],
        requiresConfirmation: false,
        priority: 'NORMAL',
      };
    }

    // 11. GENERAL LIVE RESEARCH & SCIENTIFIC INQUIRY (Default fallback)
    return {
      rawCommand: raw,
      cleanedCommand: cleaned || raw,
      intent: 'DEEP_COGNITIVE_REASONING',
      subsystem: text.includes('search') || text.includes('find') || text.includes('latest') ? 'ResearchSystem' : 'CognitiveSystem',
      protocol: text.includes('search') || text.includes('find') || text.includes('latest') ? 'LIVE_RESEARCH_PROTOCOL' : 'COGNITIVE_REASONING_PROTOCOL',
      targetObject: 'Gemini 3.7 Flash Hypercore',
      executionChain: [
        'VOICE INPUT RECEIVED',
        'INTENT ANALYSIS: AUTONOMOUS GENERAL INQUIRY',
        'SYSTEM SELECTOR: Cognitive & Knowledge Synthesis Matrix',
        'PROTOCOL: COGNITIVE_REASONING_PROTOCOL',
        'ACTION: EXECUTE HIGH-DENSITY REASONING & VERBAL SYNTHESIS',
      ],
      requiresConfirmation: false,
      priority: 'NORMAL',
    };
  }
}
