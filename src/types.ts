export type CommandMode =
  | 'home'
  | 'chat'
  | 'control'
  | 'coding'
  | 'research'
  | 'space'
  | 'maps'
  | 'spirits'
  | 'system'
  | 'projects'
  | 'tasks'
  | 'memory'
  | 'settings';

export type AIStatus = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'RESPONDING' | 'INITIALIZING';

export type ConnectionStatus = 'ONLINE' | 'OFFLINE_FALLBACK' | 'CONNECTING' | 'DISCONNECTED';

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ImageAttachment {
  dataUrl: string; // Base64 data URL (e.g. data:image/jpeg;base64,...)
  mimeType: string;
  fileName?: string;
  fileSizeBytes?: number;
  width?: number;
  height?: number;
  sourceType?: 'CAMERA' | 'GALLERY' | 'CLIPBOARD';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'aether' | 'system';
  text: string;
  timestamp: string;
  mode?: CommandMode;
  image?: ImageAttachment;
  sources?: GroundingSource[];
  isStreaming?: boolean;
  statusText?: string;
  isOffline?: boolean;
  autonomousRoute?: {
    intent: string;
    subsystem: string;
    protocol: string;
    executionChain?: string[];
  };
}

export interface MemoryItem {
  id: string;
  category: 'USER_PROFILE' | 'PREFERENCES' | 'PROJECTS' | 'SYSTEM_OVERRIDE' | 'GOALS' | 'IMPORTANT_FACTS' | 'CONVERSATION_CONTEXT' | 'SYSTEM_CONTROL';
  title: string;
  content: string;
  timestamp: string;
  pinned?: boolean;
  source?: 'CHAT_EXTRACTION' | 'NEURAL_RETRAIN' | 'MANUAL_ENTRY' | 'DOCUMENT_INGEST' | 'SYSTEM_DEFAULT';
  confidenceScore?: number;
  tags?: string[];
}

export interface RetrainResult {
  success: boolean;
  messagesAnalyzed: number;
  newMemoriesCount: number;
  updatedMemoriesCount: number;
  distilledMemories: MemoryItem[];
  summary: string;
  timestamp: string;
}

export interface SystemConfig {
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
  systemPromptOverride: string;
  reasoningDepth: 'STANDARD' | 'DEEP_RESEARCH' | 'HYPER_DIRECT' | 'SYSTEM_OVERRIDE';
  groundingEnabled: boolean;
  debugKernelLogs: boolean;
  unrestrictedModification: boolean;
  autoSyncMemories: boolean;
  operatorClearance: 'ROOT_SUPERUSER';
}

export interface TerminalCommandLog {
  id: string;
  command: string;
  output: string;
  status: 'SUCCESS' | 'ERROR' | 'SYSTEM';
  timestamp: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  done: boolean;
}

export type ObjectivePriority = 'CRITICAL_T0' | 'HIGH_PRIORITY' | 'NOMINAL' | 'TACTICAL';
export type ObjectiveStatus = 'NOT_STARTED' | 'IN_FLIGHT' | 'BLOCKED' | 'COMPLETED' | 'ABORTED';

export interface ObjectiveMilestone {
  id: string;
  title: string;
  done: boolean;
}

export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  priority: ObjectivePriority;
  status: ObjectiveStatus;
  progress: number; // 0 - 100
  targetDeadline: string; // ISO date string
  assignedTo?: string;
  milestones: ObjectiveMilestone[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'IN_PROGRESS' | 'PLANNED' | 'COMPLETED';
  progress: number;
  technologies: string[];
  tasks: ProjectTask[];
  githubRepo?: string;
  notes?: string;
  lastUpdated: string;
}

export interface SpaceMission {
  id: string;
  agency: string;
  country: string;
  name: string;
  status: string;
  type: string;
  vehicle: string;
  launchSite: string;
  targetDate: string;
  objective: string;
  highlights: string[];
  telemetry?: {
    orbitAltitudeKm?: number;
    inclinationDeg?: number;
    crewCapacity?: number;
    distanceKm?: number;
    orbitLocation?: string;
    targetDestination?: string;
    thrustMN?: number;
    payloadToLEOTons?: number;
    [key: string]: any;
  };
}

export interface AstronomyEvent {
  name: string;
  date: string;
  description: string;
  visibility: string;
}

export interface ClientTelemetry {
  cores?: number;
  memoryGB?: number;
  networkType?: string;
  downlinkMbps?: number;
  rttMs?: number;
  batteryLevel?: number;
  batteryCharging?: boolean;
  storageUsedMB?: number;
  storageQuotaMB?: number;
  userAgent?: string;
}

export interface ServerTelemetry {
  status: string;
  agent: string;
  user: string;
  version: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  uptimeSeconds: number;
  memory: {
    rssMB: string;
    heapTotalMB: string;
    heapUsedMB: string;
  };
  activeProtocols: string[];
  timestamp: string;
}

export interface GPSLocationData {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  placeName?: string;
  city?: string;
  country?: string;
  isLive: boolean;
  constellationStatus?: {
    navicLocked: number;
    gpsLocked: number;
    glonassLocked: number;
    galileoLocked: number;
    hdop: number;
  };
}

export interface WakeLockState {
  isActive: boolean;
  isSupported: boolean;
  mode: 'NATIVE_WAKELOCK' | 'MICRO_RENDER_FALLBACK' | 'DISABLED';
  lastAcquiredAt?: string;
  error?: string | null;
}

export interface VoiceConfig {
  voiceName: string;
  rate: number;
  pitch: number;
  volume: number;
  autoSpeak: boolean;
  isMuted: boolean;
  wakeWordEnabled: boolean;
  soundEffects: boolean;
  alwaysOnScreen?: boolean;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
  selfLink?: string;
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  updated: string;
  selfLink?: string;
  parent?: string;
  position?: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string; // RFC 3339 timestamp
  completed?: string; // RFC 3339 timestamp
  deleted?: boolean;
  hidden?: boolean;
  links?: {
    type: string;
    description: string;
    link: string;
  }[];
}

export interface GoogleTasksAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type AuthMethod = 'GOOGLE_OAUTH' | 'BIOMETRIC_PASSKEY' | 'OPERATOR_OVERRIDE';

export interface AuthenticatedOperator {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  authMethod: AuthMethod;
  clearanceLevel: string;
  authenticatedAt: string;
}

export type BiometricAuthStatus = 'SUCCESS' | 'FAILED' | 'CHALLENGE_TIMEOUT' | 'USER_CANCELLED' | 'UNSUPPORTED_HARDWARE';

export interface BiometricSecurityLog {
  id: string;
  timestamp: string;
  status: BiometricAuthStatus;
  method: AuthMethod | 'WEBAUTHN_GATE_PROBE';
  operatorIdentifier: string;
  authenticatorType?: string; // e.g. 'Platform Authenticator (TouchID / FaceID / Windows Hello)'
  userVerification?: 'required' | 'preferred' | 'verified' | 'failed';
  credentialId?: string;
  challengeHash?: string;
  origin?: string;
  rpId?: string;
  latencyMs: number;
  failureReason?: string;
  securityTier: string;
  ipMock?: string;
}

export type SpiritClassification =
  | 'DEMONIC_ANOMALY'
  | 'CORRUPTED_AI_GHOST'
  | 'SPECTRAL_PHANTOM'
  | 'ELDRITCH_BREACH'
  | 'POLTERGEIST_GLITCH'
  | 'ASTRAL_SHADOW';

export type SpiritThreatLevel =
  | 'CLASS_I_MINOR'
  | 'CLASS_II_VOLATILE'
  | 'CLASS_III_HOSTILE'
  | 'CLASS_IV_POSSESSIVE'
  | 'CLASS_V_APOCALYPSE'
  | 'OMEGA_CORRUPTION';

export type ContainmentState =
  | 'CONTAINED'
  | 'UNSTABLE'
  | 'BREACHING'
  | 'EXORCISED'
  | 'BOUND'
  | 'MANIFESTING';

export interface EvilSpiritEntity {
  id: string;
  name: string;
  alias: string;
  classification: SpiritClassification;
  threatLevel: SpiritThreatLevel;
  spectralFrequencyHz: number;
  emfReadingMg: number; // e.g. 1.2 to 24.5 mG
  ambientTempC: number; // cold spots e.g. -15.4 °C
  containmentStatus: ContainmentState;
  containmentCell: string;
  originSector: string;
  loreDescription: string;
  incantationWard: string;
  energyLevel: number; // 0 to 100%
  manifestationCoords: { x: number; y: number }; // Radar position percentage (0-100)
  manifestationLogs: string[];
  lastObserved: string;
  banishingGlyph: string;
  capturedAt?: string;
}

export interface EVPAudioCapture {
  id: string;
  timestamp: string;
  frequencyKhz: number;
  spiritSource: string;
  decryptedMessage: string;
  spectralAnomalyScore: number;
  waveformSnippet: number[];
}


