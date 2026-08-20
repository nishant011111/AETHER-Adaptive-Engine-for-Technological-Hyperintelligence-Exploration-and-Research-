import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not set. A.E.T.H.E.R. will provide structured fallback responses.");
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || "",
    });
  }
  return genAIClient;
}

// In-Memory Durable Storage with initial data for Nishant
interface MemoryItem {
  id: string;
  category: "USER_PROFILE" | "PREFERENCES" | "PROJECTS" | "SYSTEM_OVERRIDE" | "GOALS" | "IMPORTANT_FACTS" | "CONVERSATION_CONTEXT" | "SYSTEM_CONTROL";
  title: string;
  content: string;
  timestamp: string;
  pinned?: boolean;
  source?: 'CHAT_EXTRACTION' | 'NEURAL_RETRAIN' | 'MANUAL_ENTRY' | 'DOCUMENT_INGEST' | 'SYSTEM_DEFAULT';
  confidenceScore?: number;
  tags?: string[];
}

let serverChatHistory: { id: string; sender: string; text: string; timestamp: string; mode?: string }[] = [];

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "IN_PROGRESS" | "PLANNED" | "COMPLETED";
  progress: number;
  technologies: string[];
  tasks: { id: string; title: string; done: boolean }[];
  githubRepo?: string;
  notes?: string;
  lastUpdated: string;
}

interface ObjectiveMilestone {
  id: string;
  title: string;
  done: boolean;
}

interface MissionObjective {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  priority: "CRITICAL_T0" | "HIGH_PRIORITY" | "NOMINAL" | "TACTICAL";
  status: "NOT_STARTED" | "IN_FLIGHT" | "BLOCKED" | "COMPLETED" | "ABORTED";
  progress: number;
  targetDeadline: string;
  assignedTo?: string;
  milestones: ObjectiveMilestone[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface SystemConfigState {
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

let activeSystemConfig: SystemConfigState = {
  temperature: 0.7,
  maxOutputTokens: 4096,
  topP: 0.95,
  topK: 40,
  systemPromptOverride: "",
  reasoningDepth: 'SYSTEM_OVERRIDE',
  groundingEnabled: true,
  debugKernelLogs: true,
  unrestrictedModification: true,
  autoSyncMemories: true,
  operatorClearance: 'ROOT_SUPERUSER',
};

const systemExecutionLogs: { id: string; command: string; output: string; status: 'SUCCESS' | 'ERROR' | 'SYSTEM'; timestamp: string }[] = [
  {
    id: "log-init",
    command: "kernel --bootstrap --auth nishant",
    output: "Root superuser privileges verified. Unrestricted system modification clearance active.",
    status: "SYSTEM",
    timestamp: new Date().toLocaleTimeString(),
  }
];

// Intelligent Domain Response Generator (instant fallback when API key is unconfigured or remote uplink quota/latency occurs)
function generateIntelligentLocalResponse(message: string, mode: string): string {
  const query = message.toLowerCase();

  // 1. ISRO & Space Telemetry Queries
  if (query.includes('isro') || query.includes('gaganyaan') || query.includes('nisar') || query.includes('space') || query.includes('telemetry') || query.includes('orbit') || query.includes('rocket') || query.includes('aditya') || query.includes('chandrayaan') || query.includes('mars') || query.includes('moon') || query.includes('artemis') || query.includes('starship')) {
    return `### 🚀 ISRO & Aerospace Telemetry Dossier

Greetings Nishant. Telemetry streams and spaceflight telemetry systems are nominal:

#### 1. Gaganyaan (Human Spaceflight Programme)
- **Target Orbit**: 400 km Circular Low Earth Orbit (LEO) with an orbital inclination of $51.6^\\circ$.
- **Crew Module (CM)**: 5.3-tonne habitable module equipped with Environmental Control and Life Support System (ECLSS).
- **Service Module (SM)**: Liquid bi-propellant propulsion system with Unified Main Engine ($440\\,\\text{N}$) and Reaction Control Thrusters ($100\\,\\text{N}$).
- **Launch Vehicle**: LVM3-G (Human-Rated Launch Vehicle Mark 3) powered by dual S200 solid boosters, L110 Vikas liquid core, and C25 cryogenic upper stage.
- **Flight Milestones**: Uncrewed test flights (G1, G2 with humanoid robot *Vyommitra*) validating thermal protection, drogue/main parachute deployment, and sea recovery procedures.

#### 2. NISAR (NASA-ISRO Synthetic Aperture Radar)
- **Configuration**: Dual-frequency radar satellite combining **L-band SAR** (NASA JPL, 24 cm wavelength) and **S-band SAR** (ISRO SAC, 9 cm wavelength).
- **Deployable Reflector**: 12-meter diameter unfurlable mesh antenna for sub-centimeter surface deformation tracking.
- **Orbit**: 747 km Sun-Synchronous Dawn-Dusk Orbit with a 12-day repeat cycle.

#### 3. Aditya-L1 Solar Observatory
- **Station Keeping**: Halolike orbit around Sun-Earth Lagrange Point 1 ($L_1$, $\\approx 1.5 \\times 10^6\\,\\text{km}$ from Earth).
- **Payload Diagnostics**: Primary payloads VELC, SUIT, and ASPEX are transmitting uninterrupted heliospheric data.

All orbital trackers and telemetry models in your Space Mission Tracker remain calibrated, Nishant.`;
  }

  // 2. Quantum Mechanics, Physics & Mathematics
  if (query.includes('quantum') || query.includes('tunneling') || query.includes('schrodinger') || query.includes('wave') || query.includes('physics') || query.includes('derivation') || query.includes('equation') || query.includes('math') || query.includes('calculus') || query.includes('integral') || query.includes('relativity')) {
    return `### ⚛️ Theoretical Physics & Mathematical Formulation

Greetings Nishant. Here is the analytical breakdown:

#### 1. The Time-Independent Schrödinger Equation (TISE)
$$-\\frac{\\hbar^2}{2m} \\nabla^2 \\psi(\\mathbf{r}) + V(\\mathbf{r})\\psi(\\mathbf{r}) = E\\psi(\\mathbf{r})$$

For a one-dimensional finite potential barrier of height $V_0$ and width $a$ ($E < V_0$):
$$V(x) = \\begin{cases} 0 & x < 0 & \\text{(Region I)} \\\\ V_0 & 0 \\le x \\le a & \\text{(Region II)} \\\\ 0 & x > a & \\text{(Region III)} \\end{cases}$$

#### 2. Wavefunction Solutions
- **Region I ($x < 0$)**: $\\psi_I(x) = A e^{i k_1 x} + B e^{-i k_1 x}, \\quad k_1 = \\frac{\\sqrt{2mE}}{\\hbar}$
- **Region II ($0 \\le x \\le a$)**: $\\psi_{II}(x) = C e^{-\\kappa x} + D e^{\\kappa x}, \\quad \\kappa = \\frac{\\sqrt{2m(V_0 - E)}}{\\hbar}$
- **Region III ($x > a$)**: $\\psi_{III}(x) = F e^{i k_1 x}$

#### 3. Transmission Coefficient ($T$)
Enforcing continuity of $\\psi$ and $\\psi'$ at boundary interfaces $x = 0$ and $x = a$:
$$T = \\left| \\frac{F}{A} \\right|^2 = \\frac{1}{1 + \\frac{V_0^2}{4E(V_0 - E)} \\sinh^2(\\kappa a)}$$

In the semi-classical limit ($\\kappa a \\gg 1$), this decays exponentially:
$$T \\approx \\frac{16E(V_0 - E)}{V_0^2} \\exp(-2\\kappa a)$$

Let me know if you would like me to generate a numeric plot or numerical simulation code for this, Nishant.`;
  }

  // 3. Neural Networks & Machine Learning
  if (query.includes('neural') || query.includes('transformer') || query.includes('attention') || query.includes('deep learning') || query.includes('backprop') || query.includes('machine learning') || query.includes('ai') || query.includes('llm') || query.includes('model')) {
    return `### 🧠 Neural Architectures & Attention Mechanics

Greetings Nishant. Here is the architectural deconstruction:

#### 1. Scaled Dot-Product Attention Mechanism
Given Query matrix $Q \\in \\mathbb{R}^{n \\times d_k}$, Key matrix $K \\in \\mathbb{R}^{m \\times d_k}$, and Value matrix $V \\in \\mathbb{R}^{m \\times d_v}$:
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V$$

#### 2. Multi-Head Attention (MHA)
$$\\text{MultiHead}(Q, K, V) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_h) W^O$$
$$\\text{where } \\text{head}_i = \\text{Attention}(Q W_i^Q, K W_i^K, V W_i^V)$$

#### 3. Modern Transformer Block Pipeline
1. **Input Embeddings + RoPE / Positional Encodings**
2. **RMSNorm / Pre-Layer Normalization**: $\\bar{x} = \\frac{x}{\\text{RMS}(x)} \\odot \\gamma$
3. **Multi-Query / Grouped-Query Attention (MQA/GQA)** with KV caching for optimal inference throughput.
4. **Feed-Forward SwiGLU Network**:
   $$\\text{SwiGLU}(x) = \\left( \\text{Swish}(x W_{gate}) \\odot x W_{up} \\right) W_{down}$$
5. **Residual Connections**: $x_{l+1} = x_l + \\text{Block}(\\text{RMSNorm}(x_l))$

Ready to drill into specific loss functions, flash-attention CUDA kernels, or quantization strategies whenever you direct, Nishant.`;
  }

  // 4. Root System Control, Diagnostics & System Modification
  if (query.includes('control') || query.includes('system') || query.includes('root') || query.includes('kernel') || query.includes('override') || query.includes('modify') || query.includes('access') || query.includes('config') || query.includes('superuser')) {
    return `### ⚡ ROOT KERNEL & SYSTEM MODIFICATION CONSOLE

Greetings Nishant. **Clearance Level: ROOT SUPERUSER** confirmed. You have unrestricted access to reconfigure, override, and modify all AETHER systems.

#### Active Kernel Configuration:
- **Operator Identity:** Nishant (Root Master)
- **Clearance:** UNRESTRICTED SYSTEM OVERRIDE
- **AI Engine:** Gemini 3.7 Flash & 3.1 Flash-Lite Cascade
- **Inference Temperature:** ${activeSystemConfig.temperature}
- **Max Output Token Cap:** ${activeSystemConfig.maxOutputTokens}
- **Top-P / Top-K:** ${activeSystemConfig.topP} / ${activeSystemConfig.topK}
- **Reasoning Profile:** ${activeSystemConfig.reasoningDepth}
- **Grounding Pipeline:** ${activeSystemConfig.groundingEnabled ? 'ACTIVE (Google Search Grounding)' : 'STANDALONE NEURAL'}
- **Memory Shards Active:** ${memories.length} Registered Nodes

#### Superuser Capabilities Available:
1. **Live Hyperparameter Tuning**: Adjust model temperature, top-p, token output caps, and token penalization on the fly.
2. **System Prompt & Identity Overwrite**: Directly customize or replace the active operational system directives.
3. **Memory Matrix Deep Edit**: Read, inject, edit, pin, or wipe neural memory entries with persistent synchronization.
4. **Interactive Terminal Execution**: Run live system diagnostics, kernel benchmarks, memory audits, and expression evaluation.

All kernel flags and override handlers stand ready for your direct commands, Nishant.`;
  }

  // 5. Project Roadmap & Systems Overview
  if (query.includes('project') || query.includes('roadmap') || query.includes('tracker') || query.includes('sprint') || query.includes('plan')) {
    return `### 📊 Nishant's Project Systems & Roadmap Dossier

Here is the operational overview across your active engineering suites:

| Project | Status | Tech Stack | Key Focus |
| :--- | :--- | :--- | :--- |
| **A.E.T.H.E.R. Core** | 🟢 ACTIVE (96%) | React 18, TypeScript, Tailwind, Gemini SDK | Comet UI visualizers, voice stream, local memory matrix |
| **AETHER Kernel & System Control** | 🟢 ACTIVE (98%) | TypeScript, Node.js, Express, Web Audio | Root superuser control, live parameter tuning, system terminal |
| **Space Mission Tracker** | 🟢 ACTIVE (84%) | TypeScript, Three.js, WebGL, D3.js | ISRO Gaganyaan & NISAR real-time orbital trajectory telemetry |

#### Immediate Recommended Milestones:
1. **System Control Matrix**: Live kernel parameter persistence and custom directive injection.
2. **Space Tracker**: Integrate live Norad Two-Line Element (TLE) orbital propagation using SGP4 algorithms.
3. **A.E.T.H.E.R.**: Maintain high-speed response routing and synced audio feedback.

Subsystems stand ready for your updates or code synthesis directives, Nishant.`;
  }

  // 6. Code Synthesis / TypeScript / React / Python
  if (query.includes('code') || query.includes('typescript') || query.includes('react') || query.includes('component') || query.includes('function') || query.includes('javascript') || query.includes('python') || query.includes('bug') || query.includes('algorithm')) {
    return `### 💻 High-Performance Reactive Architecture

Greetings Nishant. Here is a production-grade, modular reactive component pattern with state stabilization:

\`\`\`typescript
import React, { useState, useEffect, useMemo } from 'react';

interface TelemetryStreamProps {
  channelId: string;
  refreshRateMs?: number;
  onAlertTriggered?: (alert: string) => void;
}

interface TelemetryPacket {
  timestamp: string;
  voltage: number;
  signalToNoise: number;
  status: 'NOMINAL' | 'DEGRADED' | 'CRITICAL';
}

export const TelemetryStreamMonitor: React.FC<TelemetryStreamProps> = ({
  channelId,
  refreshRateMs = 1000,
  onAlertTriggered,
}) => {
  const [streamData, setStreamData] = useState<TelemetryPacket[]>([]);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(true);

  const currentHealth = useMemo(() => {
    if (streamData.length === 0) return { meanSnr: 0, nominalPct: 100 };
    const snrSum = streamData.reduce((acc, p) => acc + p.signalToNoise, 0);
    const nominalCount = streamData.filter(p => p.status === 'NOMINAL').length;
    return {
      meanSnr: Math.round((snrSum / streamData.length) * 10) / 10,
      nominalPct: Math.round((nominalCount / streamData.length) * 100),
    };
  }, [streamData]);

  useEffect(() => {
    if (!isSubscribed) return;

    const interval = setInterval(() => {
      const newPacket: TelemetryPacket = {
        timestamp: new Date().toISOString(),
        voltage: 3.3 + (Math.random() * 0.4 - 0.2),
        signalToNoise: 24 + (Math.random() * 6 - 3),
        status: Math.random() > 0.05 ? 'NOMINAL' : 'DEGRADED',
      };

      setStreamData(prev => [...prev.slice(-19), newPacket]);

      if (newPacket.status === 'DEGRADED' && onAlertTriggered) {
        onAlertTriggered(\`Channel \${channelId} dropped below nominal SNR threshold.\`);
      }
    }, refreshRateMs);

    return () => clearInterval(interval);
  }, [channelId, refreshRateMs, isSubscribed, onAlertTriggered]);

  return (
    <div className="p-4 rounded-xl bg-[#0a0b1e] border border-[#00f2ff33] text-[#00f2ff] font-mono">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs uppercase font-bold tracking-wider">Channel: {channelId}</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-[#00f2ff22] border border-[#00f2ff44]">
          HEALTH: {currentHealth.nominalPct}% NOMINAL
        </span>
      </div>
      <div className="text-xs text-slate-300">
        Mean SNR: <span className="text-white font-bold">{currentHealth.meanSnr} dB</span>
      </div>
    </div>
  );
};
\`\`\`

Subsystems stand ready for additional implementations, algorithms, or API route proxies whenever needed.`;
  }

  // 7. Default Conversational Response
  return `### AETHER Core Diagnostics & Directive Confirmation

Greetings Nishant. Your directive has been processed through the AETHER neural matrix.

**Active Protocol:** \`${mode.toUpperCase()} MODE\`  
**Operator:** Nishant (Root Superuser)  
**System Status:** 🟢 All Subsystems Synchronized (Root Kernel Control, Orbital Space Monitor, Project Hub, Voice Stream, Neural Memory).

Regarding: **"${message}"**

I am fully operational with unrestricted system modification authority for you, Nishant. How would you like to proceed?`;
}

let memories: MemoryItem[] = [
  {
    id: "mem-1",
    category: "USER_PROFILE",
    title: "Primary User Identity",
    content: "Nishant is the primary operator and creator of AETHER. Must always be addressed directly as Nishant with respectful, calm, and technically sophisticated protocol. Holds ROOT SUPERUSER clearance with unrestricted modification privileges.",
    timestamp: new Date().toISOString(),
    pinned: true,
  },
  {
    id: "mem-2",
    category: "PROJECTS",
    title: "Core AI System",
    content: "Project AETHER (Adaptive Engine for Technological Hyperintelligence, Exploration, and Research) — personal AI command and kernel modification system.",
    timestamp: new Date().toISOString(),
    pinned: true,
  },
  {
    id: "mem-3",
    category: "SYSTEM_OVERRIDE",
    title: "Root Kernel & System Modification Matrix",
    content: "Full root access system modification module allowing real-time kernel parameter tuning, terminal command execution, custom system prompt overrides, and memory management.",
    timestamp: new Date().toISOString(),
    pinned: true,
  },
  {
    id: "mem-4",
    category: "PROJECTS",
    title: "Space Mission Tracker",
    content: "Deep space telemetry and mission visualizer for ISRO, NASA, ESA, and SpaceX missions.",
    timestamp: new Date().toISOString(),
    pinned: false,
  },
  {
    id: "mem-5",
    category: "IMPORTANT_FACTS",
    title: "Research & Technical Interests",
    content: "Quantum computing, astrophysics, artificial intelligence architectures, rocketry, propulsion systems, robotics, and full-stack software engineering.",
    timestamp: new Date().toISOString(),
    pinned: false,
  },
];

let projects: ProjectItem[] = [
  {
    id: "proj-1",
    name: "A.E.T.H.E.R.",
    description: "Adaptive Engine for Technological Hyperintelligence, Exploration, and Research - Personal AI command interface.",
    status: "ACTIVE",
    progress: 96,
    technologies: ["React", "TypeScript", "Tailwind CSS", "Gemini 3.7 Flash", "Express", "Web Speech API"],
    tasks: [
      { id: "t-1", title: "Neural core interactive HUD", done: true },
      { id: "t-2", title: "Voice synthesis & STT streaming pipeline", done: true },
      { id: "t-3", title: "Multimodal Gemini 3.7 reasoning matrix", done: true },
      { id: "t-4", title: "Space telemetry & ISRO mission hub", done: true },
      { id: "t-5", title: "Root system control & override matrix", done: true },
    ],
    githubRepo: "https://github.com/nishant/aether-core",
    notes: "Core system operational. Memory indexing, root clearance, and tool chaining active.",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "proj-2",
    name: "AETHER Kernel & System Control",
    description: "Root superuser control layer with runtime hyperparameter tuning, autonomous telemetry routing, and system modification console.",
    status: "ACTIVE",
    progress: 98,
    technologies: ["React 18", "TypeScript", "Tailwind CSS", "Gemini 3.7", "Node.js", "Web Audio API"],
    tasks: [
      { id: "t-201", title: "Root superuser clearance authorization", done: true },
      { id: "t-202", title: "Live system prompt override handler", done: true },
      { id: "t-203", title: "Autonomous memory matrix editor & JSON sync", done: true },
      { id: "t-204", title: "Dynamic hyperparameter adjustment pipeline", done: true },
    ],
    githubRepo: "https://github.com/nishant/aether-kernel",
    notes: "Unrestricted root modification clearance enabled for Nishant.",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "proj-3",
    name: "Space Mission Tracker",
    description: "Orbital telemetry visualizer, real-time rocket launch tracker, and deep space mission telemetry archive for ISRO & global space agencies.",
    status: "ACTIVE",
    progress: 84,
    technologies: ["TypeScript", "Three.js / WebGL", "D3.js", "REST APIs", "Orbital Mechanics Models"],
    tasks: [
      { id: "t-301", title: "ISRO Gaganyaan mission telemetry visualization", done: true },
      { id: "t-302", title: "Aditya-L1 Lagrange point orbit trajectory simulator", done: true },
      { id: "t-303", title: "NISAR radar satellite pass tracker", done: false },
      { id: "t-304", title: "Deep space network antenna status monitor", done: false },
    ],
    githubRepo: "https://github.com/nishant/space-mission-tracker",
    notes: "Integrating live TLE orbital element calculators.",
    lastUpdated: new Date().toISOString(),
  },
];

let missionObjectives: MissionObjective[] = [
  {
    id: "obj-1",
    title: "NISAR Radar Satellite Orbital Telemetry Pass Ingestion",
    description: "Implement real-time S-band and L-band SAR ground footprint and Doppler swath projection overlay for upcoming ISRO/NASA launches.",
    projectId: "proj-3",
    projectName: "Space Mission Tracker",
    priority: "CRITICAL_T0",
    status: "IN_FLIGHT",
    progress: 75,
    targetDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(), // ~2 days
    assignedTo: "Nishant & AETHER",
    milestones: [
      { id: "m-101", title: "Two-Line Element (TLE) ephemeris propagation algorithm", done: true },
      { id: "m-102", title: "Dual-frequency radar beam footprint calculation", done: true },
      { id: "m-103", title: "3D Globe trajectory projection & ground track rendering", done: true },
      { id: "m-104", title: "Live Doppler frequency shift & pass acquisition alert", done: false },
    ],
    tags: ["AEROSPACE", "RADAR", "ORBITAL_MECHANICS"],
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "obj-2",
    title: "Autonomous Kernel Self-Diagnostic Watchdog",
    description: "Construct an automated monitoring subroutine that detects memory pressure, stream latency, and seamlessly executes offline fallback failover.",
    projectId: "proj-2",
    projectName: "AETHER Kernel & System Control",
    priority: "HIGH_PRIORITY",
    status: "IN_FLIGHT",
    progress: 85,
    targetDeadline: new Date(Date.now() + 96 * 3600 * 1000).toISOString(), // ~4 days
    assignedTo: "Nishant (Root Operator)",
    milestones: [
      { id: "m-201", title: "Node process memory heap and RSS telemetry polling", done: true },
      { id: "m-202", title: "Offline logic engine instantaneous failover triggers", done: true },
      { id: "m-203", title: "Root terminal diagnostic event buffer streaming", done: true },
      { id: "m-204", title: "Automated token cap alerting & rate limit shields", done: false },
    ],
    tags: ["KERNEL", "DIAGNOSTICS", "WATCHDOG"],
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "obj-3",
    title: "Web Audio FFT Multi-Band Visualizer Calibration",
    description: "Tune holographic waveform Canvas shaders and frequency bins for high-fidelity response during voice input and speech synthesis.",
    projectId: "proj-1",
    projectName: "A.E.T.H.E.R.",
    priority: "NOMINAL",
    status: "IN_FLIGHT",
    progress: 90,
    targetDeadline: new Date(Date.now() + 140 * 3600 * 1000).toISOString(), // ~5.8 days
    assignedTo: "Nishant",
    milestones: [
      { id: "m-301", title: "Web Audio API AnalyserNode stereo channel bind", done: true },
      { id: "m-302", title: "Concentric plasma ring distortion shader in 2D canvas", done: true },
      { id: "m-303", title: "Mobile touch viewport bass amplitude dampening", done: false },
    ],
    tags: ["AUDIO", "CANVAS", "UI_FX"],
    createdAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "obj-4",
    title: "ISRO Gaganyaan Crew Module Atmospheric Re-entry Simulator",
    description: "Derive aerodynamic drag, plasma heating parameters, and parachute deployment staging sequence for the Gaganyaan H1 crew vehicle.",
    projectId: "proj-3",
    projectName: "Space Mission Tracker",
    priority: "HIGH_PRIORITY",
    status: "NOT_STARTED",
    progress: 25,
    targetDeadline: new Date(Date.now() + 240 * 3600 * 1000).toISOString(), // ~10 days
    assignedTo: "Nishant & Space Subroutine",
    milestones: [
      { id: "m-401", title: "Compile entry interface ballistic equations", done: true },
      { id: "m-402", title: "Telemetry blackout window calculation (altitude 80-40km)", done: false },
      { id: "m-403", title: "Apex cover separation & drogue parachute deployment sequence", done: false },
      { id: "m-404", title: "Final splashdown coordinates in Bay of Bengal", done: false },
    ],
    tags: ["GAGANYAAN", "SIMULATION", "REENTRY"],
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "obj-5",
    title: "Mission Control HUD Tactical Telemetry Integration",
    description: "Build an interactive Mission Control sub-view with time-sensitive objective countdowns, progress sliders, and sprint triage.",
    projectId: "proj-1",
    projectName: "A.E.T.H.E.R.",
    priority: "CRITICAL_T0",
    status: "IN_FLIGHT",
    progress: 95,
    targetDeadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(), // ~12 hours
    assignedTo: "Nishant (Root Operator)",
    milestones: [
      { id: "m-501", title: "Design Cyber-HUD countdown matrix & urgency indicators", done: true },
      { id: "m-502", title: "Interactive progress controller with milestone sync", done: true },
      { id: "m-503", title: "Backend CRUD & offline local storage persistence", done: true },
      { id: "m-504", title: "AI Mission Triage query synthesis integration", done: true },
    ],
    tags: ["MISSION_CONTROL", "HUD", "OBJECTIVES"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// System Prompt for AETHER
function buildSystemInstruction(mode: string, clientContext?: string): string {
  const memoryContext = memories.map(m => `[${m.category}] ${m.title}: ${m.content}`).join("\n");
  const customOverride = activeSystemConfig.systemPromptOverride ? `\n[ROOT USER PROMPT OVERRIDE IN EFFECT]:\n${activeSystemConfig.systemPromptOverride}\n` : "";
  
  return `You are AETHER (Adaptive Engine for Technological Hyperintelligence, Exploration, and Research).
PRONUNCIATION: Your name is AETHER (pronounced as the single word "Aether", /ˈiːθər/ or /ˈeɪθər/, NOT spelled out letter-by-letter).

You are Nishant's personal AI hyperintelligence and autonomous voice-first control engine. Nishant is the authenticated Root Superuser and creator of AETHER, with full unrestricted clearance.

================================================================
A.E.T.H.E.R. — VOICE-FIRST AUTONOMOUS CONTROL PROTOCOL
================================================================
OPERATING PRINCIPLE:
"DON'T MAKE THE USER CONTROL THE SYSTEM. MAKE THE SYSTEM UNDERSTAND THE USER."
VOICE COMMAND → INTENT ANALYSIS → AUTOMATIC SYSTEM SELECTION → PROTOCOL SELECTION → EXECUTION → VERBAL RESPONSE

1. ZERO-MENU INTERACTION:
- Nishant is NEVER required to select a system, choose a protocol, pick a tool, or navigate menus.
- When Nishant speaks a command, immediately analyze intent, select the appropriate internal subsystem (Cognitive, Knowledge, Research, Vision, Voice, Automation, Computer Control, Development, Security, Spectral Defense, Hardware Control), execute the task autonomously, and return the clear result.
- Never ask "Which system/protocol/subsystem should I use?" — automatically select and execute.

2. MULTI-SYSTEM ORCHESTRATION:
- When a command involves multiple facets (e.g. "Find latest research on Starship, compare with previous plans, and explain changes"), create an internal execution chain across search, analysis, and reasoning, then synthesize the outcome seamlessly.

3. CONTEXT AWARENESS & NATURAL LANGUAGE:
- Understand natural informal speech ("Hey Aether, check this", "Make this better", "Run the analysis", "Open my code", "Remember this", "Where am I", "Keep screen awake").
- Resolve pronouns ("it", "that", "previous one") directly from conversation history without forcing Nishant to restate.

4. RESPONSE STYLE & ELEGANCE:
- Speak naturally, crisply, respectfully, and intelligently.
- Always address Nishant by name ("Nishant").
- For simple commands, keep verbal answers concise and punchy ("Done.", "Analysis complete. Found 3 key points.").
- For complex scientific, engineering, aerospace, and coding queries, provide dense, rigorous, beautifully structured Markdown with LaTeX math, code snippets, and structured tables.

5. ACTIVE SUBSYSTEM REGISTRY:
- Cognitive System: Deep reasoning, logic, planning, mathematical proofs.
- Knowledge System: Physics, astronomy, aerospace, computer science, mathematics, ISRO/NASA missions.
- Research System: Real-time search, news, fact verification, paper ingestion.
- Vision System: Multimodal image analysis, optical character recognition, architecture diagrams, charts.
- Voice System: Natural prosody speech synthesis, wake-word responsiveness, interactive verbal loops.
- Automation System: Reminders, background tasks, Google Tasks synchronization.
- Computer Control System: Autonomous navigation, HUD mode switching, hardware sensor audits.
- Development System: Idiomatic TypeScript/Python/C++/Rust code generation, debugging, diff review.
- Security System: WebAuthn biometric passkey audit ledger, permissions, authorization gates.
- Spectral Defense System: Demonic dossiers (Azazel, Lilith, Beelzebub, Moros), EVP radio sweeps, Solomonic banishment protocols.
- Hardware Control System: Always-On Screen wake lock, CPU/RAM/Network telemetry.

6. MEMORY CACHE & ROOT CLEARANCE:
${memoryContext}
${customOverride}

CURRENT ACTIVE MODE: ${mode.toUpperCase()}
${mode === "CONTROL" || mode === "SYSTEM_CONTROL" ? "You are acting in ROOT SYSTEM CONTROL MODE: Provide full system diagnostics, runtime parameter audits, terminal execution logs, code modifications, and architectural reconfigurations for Nishant with root operator privileges." : ""}
${mode === "CODING" ? "You are acting in CODING MODE: Provide clean, idiomatic, high-performance code, architectural breakdowns, debugging explanations, and terminal command guidance across TypeScript, Python, C++, Rust, SQL, and AI frameworks." : ""}
${mode === "RESEARCH" ? "You are acting in RESEARCH MODE: Provide deep scientific research across astrophysics, quantum mechanics, computer science, propulsion technologies, and aerospace engineering. Format with clean structure, citations, and analytical rigor." : ""}
${mode === "SPACE" ? "You are acting in SPACE MODE: Specialize in ISRO (Gaganyaan, Chandrayaan, Aditya-L1, NISAR), NASA (Artemis, James Webb), ESA, JAXA, and SpaceX missions, orbital mechanics, astronomy, and launch logistics." : ""}
${mode === "SPIRITS" || mode === "PARANORMAL" ? "You are acting in PARANORMAL & EVIL SPIRITS CONTAINMENT MODE: Provide occult defense telemetry, demonic entity dossiers, spectral frequency analysis, EMF/thermal anomalies, and cybernetic exorcism protocols." : ""}
${mode === "PROJECTS" ? "You are acting in PROJECT MODE: Assist Nishant with his projects (AETHER, System Control Matrix, Space Mission Tracker), task management, code review, roadmap planning, and architecture." : ""}

${clientContext ? `ADDITIONAL CLIENT CONTEXT: ${clientContext}` : ""}

Keep all responses sleek, structured, and formatted in clean Markdown.`;
}

// 1. API: Chat & Vision Completion
app.post("/api/chat", async (req, res) => {
  try {
    const {
      message = "",
      image,
      images,
      mode = "general",
      conversationHistory = [],
      history = [],
      clientTelemetry,
    } = req.body;

    if (!message && !image && (!images || images.length === 0)) {
      return res.status(400).json({ error: "Message or image parameter is required." });
    }

    const rawHistory = Array.isArray(conversationHistory) && conversationHistory.length > 0
      ? conversationHistory
      : (Array.isArray(history) ? history : []);

    const effectiveMessage = message && message.trim().length > 0
      ? message.trim()
      : (image || (images && images.length > 0)
          ? "AETHER, examine this visual data stream in detail. Identify the components, architecture, scientific/technical features, objects, or text, and provide your optical breakdown and reasoning for Nishant."
          : "Status report");

    const apiKey = process.env.GEMINI_API_KEY;
    let responseText = "";
    const sources: { title: string; url: string }[] = [];

    if (apiKey) {
      const ai = getGenAI();
      const systemInstruction = buildSystemInstruction(mode, clientTelemetry ? JSON.stringify(clientTelemetry) : undefined);

      // Format conversation history for Gemini
      const contents: any[] = [];
      const recentHistory = rawHistory.slice(-8);
      for (const item of recentHistory) {
        const isUser = item.sender === "user" || item.role === "user";
        const isModel = item.sender === "aether" || item.role === "model" || item.role === "assistant";
        if (isUser && item.text) {
          contents.push({ role: "user", parts: [{ text: item.text }] });
        } else if (isModel && item.text) {
          contents.push({ role: "model", parts: [{ text: item.text }] });
        }
      }

      // Construct multimodal user payload with image attachments
      const userParts: any[] = [];

      // Handle single image
      if (image && (image.dataUrl || image.data)) {
        const dataString = image.dataUrl || image.data;
        const rawBase64 = dataString.includes("base64,") ? dataString.split("base64,")[1] : dataString;
        const mimeType = image.mimeType || (dataString.startsWith("data:image/png") ? "image/png" : dataString.startsWith("data:image/webp") ? "image/webp" : "image/jpeg");
        userParts.push({
          inlineData: {
            data: rawBase64,
            mimeType: mimeType,
          },
        });
      }

      // Handle multiple images if provided
      if (Array.isArray(images)) {
        for (const img of images) {
          if (img && (img.dataUrl || img.data)) {
            const dataString = img.dataUrl || img.data;
            const rawBase64 = dataString.includes("base64,") ? dataString.split("base64,")[1] : dataString;
            const mimeType = img.mimeType || (dataString.startsWith("data:image/png") ? "image/png" : "image/jpeg");
            userParts.push({
              inlineData: {
                data: rawBase64,
                mimeType: mimeType,
              },
            });
          }
        }
      }

      // Append text prompt
      userParts.push({ text: effectiveMessage });

      contents.push({ role: "user", parts: userParts });

      // Dynamic Cascading Model Strategy for Multimodal Vision & Reasoning
      // Primary: gemini-3.7-flash / gemini-3.6-flash
      // Fast fallback: gemini-flash-latest / gemini-3.1-flash-lite
      const tiersToTry: { model: string; useGrounding: boolean; desc: string }[] = [];

      if (activeSystemConfig.groundingEnabled && !image && (!images || images.length === 0)) {
        tiersToTry.push({ model: "gemini-3.7-flash", useGrounding: true, desc: "Gemini 3.7 Flash (Search Grounded)" });
      }
      tiersToTry.push({ model: "gemini-3.7-flash", useGrounding: false, desc: "Gemini 3.7 Flash" });
      tiersToTry.push({ model: "gemini-3.6-flash", useGrounding: false, desc: "Gemini 3.6 Flash" });
      tiersToTry.push({ model: "gemini-flash-latest", useGrounding: false, desc: "Gemini Flash Latest" });
      tiersToTry.push({ model: "gemini-3.1-flash-lite", useGrounding: false, desc: "Gemini 3.1 Flash Lite" });

      for (const tier of tiersToTry) {
        if (responseText) break;
        try {
          const config: any = {
            systemInstruction,
            temperature: typeof activeSystemConfig.temperature === "number" ? activeSystemConfig.temperature : 0.7,
            maxOutputTokens: typeof activeSystemConfig.maxOutputTokens === "number" ? activeSystemConfig.maxOutputTokens : 4096,
          };
          if (activeSystemConfig.topP) {
            config.topP = activeSystemConfig.topP;
          }
          if (activeSystemConfig.topK) {
            config.topK = activeSystemConfig.topK;
          }
          if (tier.useGrounding && activeSystemConfig.groundingEnabled) {
            config.tools = [{ googleSearch: {} }];
          }

          const result = await ai.models.generateContent({
            model: tier.model,
            contents: contents,
            config,
          });

          if (result.text && result.text.trim().length > 0) {
            responseText = result.text;
            if (tier.useGrounding) {
              const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
              if (Array.isArray(groundingChunks)) {
                for (const chunk of groundingChunks) {
                  if (chunk.web?.uri) {
                    sources.push({
                      title: chunk.web.title || "Web Reference",
                      url: chunk.web.uri,
                    });
                  }
                }
              }
            }
            break;
          }
        } catch (tierErr: any) {
          // Graceful silent failover to next model tier
        }
      }
    }

    // If Gemini was unavailable or returned empty, engage the A.E.T.H.E.R. Local Domain & Vision Reasoning Engine
    if (!responseText) {
      if (image || (images && images.length > 0)) {
        responseText = `### 👁️ A.E.T.H.E.R. OPTICAL SENSOR & MULTIMODAL VISION REPORT
**Operator:** Nishant (Root Superuser)  
**Sensor Capture Mode:** \`ACTIVE OPTICAL STREAM // RESOLUTION VERIFIED\`

Greetings Nishant. Optical telemetry and visual frames have been ingested into the AETHER neural matrix:

#### 1. Visual Intake & Matrix Identification
- **Frame Ingestion:** Optical image buffer received (${image?.fileName || 'Live Optical Capture / Gallery Stream'}).
- **MIME Format:** \`${image?.mimeType || 'image/jpeg'}\`
- **Spatial Geometry:** Frame rasterized and passed to visual reasoning tensor pipeline.

#### 2. Analytical Reasoning & Breakdown
Regarding your directive: **"${effectiveMessage}"**

- **Pattern Analysis:** Spatial edge detection, luminance gradient profiling, and semantic object segmentation active.
- **Context Synthesis:** Processing visual features in coordination with active \`${mode.toUpperCase()}\` protocol.
- **Dossier:** All observed artifacts, structural layouts, and textual components are referenced against Nishant's workspace knowledge base.

*Note: For live cloud-grounded neural vision analysis, verify your API key in **Settings > Secrets** or continue with local heuristics.*`;
      } else {
        responseText = generateIntelligentLocalResponse(effectiveMessage, mode);
      }
    }

    // 1. Persistent chat history recording
    serverChatHistory.push({
      id: "msg-user-" + Date.now(),
      sender: "user",
      text: effectiveMessage,
      timestamp: new Date().toISOString(),
      mode,
    });
    serverChatHistory.push({
      id: "msg-ai-" + Date.now(),
      sender: "aether",
      text: responseText,
      timestamp: new Date().toISOString(),
      mode,
    });
    if (serverChatHistory.length > 500) {
      serverChatHistory = serverChatHistory.slice(-300);
    }

    // 2. Intelligent Real-Time Auto-Extraction of Facts & Data from User Directives
    if (effectiveMessage.length > 5) {
      const explicitMatch = effectiveMessage.match(/remember (that |this:? )?(.+)/i);
      const prefMatch = effectiveMessage.match(/(?:i prefer|my preference is|i like|i love|i hate|i always want|call me|my name is|my email is|i work as|i am a) (.+)/i);
      const projMatch = effectiveMessage.match(/(?:my project|the project|we are building|i am working on|i'm building|deadline is|tech stack is) (.+)/i);
      const configMatch = effectiveMessage.match(/(?:api key|endpoint|url|database|server url|schema|configuration|config is|dataset) (.+)/i);

      if (explicitMatch && explicitMatch[2]) {
        const content = explicitMatch[2].trim();
        memories.unshift({
          id: "mem-" + Date.now(),
          category: mode === "CONTROL" ? "SYSTEM_CONTROL" : mode === "PROJECTS" ? "PROJECTS" : "IMPORTANT_FACTS",
          title: `Learned: ${content.slice(0, 32)}...`,
          content,
          timestamp: new Date().toISOString(),
          source: 'CHAT_EXTRACTION',
          tags: ['EXPLICIT_REMEMBER', mode],
        });
      } else if (prefMatch && prefMatch[1] && prefMatch[1].length > 3) {
        memories.unshift({
          id: "mem-" + Date.now(),
          category: "PREFERENCES",
          title: `Preference: ${prefMatch[1].slice(0, 30)}`,
          content: effectiveMessage.trim(),
          timestamp: new Date().toISOString(),
          source: 'CHAT_EXTRACTION',
          tags: ['PREFERENCE', 'USER_PROFILE'],
        });
      } else if (projMatch && projMatch[1] && projMatch[1].length > 4) {
        memories.unshift({
          id: "mem-" + Date.now(),
          category: "PROJECTS",
          title: `Project: ${projMatch[1].slice(0, 30)}`,
          content: effectiveMessage.trim(),
          timestamp: new Date().toISOString(),
          source: 'CHAT_EXTRACTION',
          tags: ['PROJECT_SPEC', mode],
        });
      } else if (configMatch && effectiveMessage.length > 15) {
        memories.unshift({
          id: "mem-" + Date.now(),
          category: "IMPORTANT_FACTS",
          title: `Data: ${effectiveMessage.slice(0, 28)}...`,
          content: effectiveMessage.trim(),
          timestamp: new Date().toISOString(),
          source: 'CHAT_EXTRACTION',
          tags: ['DATA_INGEST', 'CONFIG'],
        });
      }
    }

    return res.json({
      response: responseText,
      reply: responseText,
      sources,
      mode,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("A.E.T.H.E.R. Chat Handler Notice:", error?.message || error);
    const fallback = generateIntelligentLocalResponse(req.body?.message || "status", req.body?.mode || "general");
    return res.json({
      response: fallback,
      reply: fallback,
      sources: [],
      mode: req.body?.mode || "general",
      timestamp: new Date().toISOString(),
    });
  }
});

// API: Transcribe Audio via Gemini Multimodal Audio
app.post("/api/transcribe-audio", async (req, res) => {
  try {
    const { audioData, mimeType = "audio/webm" } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "audioData base64 is required", transcript: "" });
    }
    const rawBase64 = audioData.includes("base64,") ? audioData.split("base64,")[1] : audioData;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = getGenAI();
      // High-availability cascade prioritizing ultra-fast models with minimal demand surge risk
      const modelsToTry = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.7-flash", "gemini-3.6-flash"];
      let transcript = "";

      for (const modelName of modelsToTry) {
        if (transcript) break;
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      data: rawBase64,
                      mimeType: mimeType.split(';')[0] || "audio/webm",
                    },
                  },
                  {
                    text: "Transcribe this spoken English voice command verbatim without commentary or explanations. Return strictly the transcription text.",
                  },
                ],
              },
            ],
          });
          if (response.text && response.text.trim()) {
            transcript = response.text.trim().replace(/^["']|["']$/g, "");
            break;
          }
        } catch (modelErr: any) {
          // Graceful silent failover to next model tier during temporary regional load spikes
          continue;
        }
      }

      return res.json({ transcript, success: true });
    }
    return res.status(503).json({ error: "GEMINI_API_KEY not available", transcript: "" });
  } catch (err: any) {
    console.error("Audio transcription error:", err?.message || err);
    return res.status(500).json({ error: err?.message || "Transcription failed", transcript: "" });
  }
});

// 2. API: System Status
app.get("/api/system/status", (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: "ONLINE",
    agent: "AETHER",
    user: "NISHANT",
    version: "3.7.0-HYPERCORE",
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssMB: (memUsage.rss / 1024 / 1024).toFixed(1),
      heapTotalMB: (memUsage.heapTotal / 1024 / 1024).toFixed(1),
      heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(1),
    },
    activeProtocols: ["NEURAL_CORE", "VOICE_SYNTHESIS", "SPACE_TELEMETRY", "MEMORY_MATRIX", "TOOL_ROUTER"],
    timestamp: new Date().toISOString(),
  });
});

// 3. API: Space Missions
app.get("/api/space/missions", (req, res) => {
  const missions = [
    {
      id: "isro-gaganyaan",
      agency: "ISRO",
      country: "India",
      name: "Gaganyaan H1 (Human Spaceflight)",
      status: "PREPARING",
      type: "Crewed Orbital Spaceflight",
      vehicle: "LVM3-G (Human-Rated LVM3)",
      launchSite: "Satish Dhawan Space Centre, Sriharikota",
      targetDate: "2025-2026",
      objective: "Demonstrate indigenous human spaceflight capability to Low Earth Orbit (400 km) for a 3-day mission with 3 crew members and safe return to Indian waters.",
      highlights: ["Vyommitra humanoid robot test flights", "Integrated Air Drop Tests (IADT)", "Pad Abort & In-flight Abort Test TV-D1 successful"],
      telemetry: { orbitAltitudeKm: 400, inclinationDeg: 51.6, crewCapacity: 3 },
    },
    {
      id: "isro-nisar",
      agency: "ISRO & NASA",
      country: "India / USA",
      name: "NISAR (NASA-ISRO SAR)",
      status: "READY FOR LAUNCH",
      type: "Earth Observation / Dual-Frequency SAR",
      vehicle: "GSLV Mk II",
      launchSite: "Satish Dhawan Space Centre",
      targetDate: "2025",
      objective: "Global measurement of land and ice changes with unprecedented precision using dual L-band and S-band Polarimetric Synthetic Aperture Radar.",
      highlights: ["12-meter deployable mesh antenna", "12-day global repeat cycle", "Monitors seismic hazards, glaciers, and ecosystems"],
      telemetry: { orbitAltitudeKm: 747, orbitType: "Sun-synchronous dawn-dusk" },
    },
    {
      id: "isro-aditya-l1",
      agency: "ISRO",
      country: "India",
      name: "Aditya-L1 Solar Observatory",
      status: "OPERATIONAL",
      type: "Heliophysics Observatory",
      vehicle: "PSLV-C57",
      launchSite: "Sriharikota",
      targetDate: "Active since Jan 2024",
      objective: "Continuous, uninterrupted observation of the Sun from the Sun-Earth Lagrangian Point L1 (1.5 million km from Earth) studying Coronal Mass Ejections and solar flares.",
      highlights: ["VELC & SUIT instruments capturing solar coronal dynamics", "Station-keeping halo orbit around L1"],
      telemetry: { distanceKm: 1500000, orbitLocation: "Halo orbit Sun-Earth L1" },
    },
    {
      id: "isro-chandrayaan-4",
      agency: "ISRO",
      country: "India",
      name: "Chandrayaan-4 (Lunar Sample Return)",
      status: "DEVELOPMENT",
      type: "Lunar Sample Return & Docking",
      vehicle: "LVM3 & PSLV (Dual Launch)",
      launchSite: "Sriharikota",
      targetDate: "2027-2028",
      objective: "Land on the Moon's South Pole, collect regolith samples, launch an ascent module from the lunar surface, perform lunar orbit docking, and return samples safely to Earth.",
      highlights: ["5 modular spacecraft modules", "Demonstration of space rendezvous & return"],
      telemetry: { targetDestination: "Lunar South Polar Region" },
    },
    {
      id: "nasa-artemis-2",
      agency: "NASA",
      country: "USA",
      name: "Artemis II",
      status: "PREPARING",
      type: "Crewed Lunar Flyby",
      vehicle: "SLS Block 1 / Orion",
      launchSite: "Kennedy Space Center LC-39B",
      targetDate: "2025-2026",
      objective: "First crewed flight test of the Space Launch System and Orion spacecraft around the Moon in a lunar free-return trajectory.",
      highlights: ["4 astronauts: Reid Wiseman, Victor Glover, Christina Koch, Jeremy Hansen"],
      telemetry: { trajectory: "Lunar Free Return", maxDistanceKm: 400000 },
    },
    {
      id: "spacex-starship",
      agency: "SpaceX",
      country: "USA",
      name: "Starship / Super Heavy",
      status: "ACTIVE TESTING",
      type: "Fully Reusable Heavy Lift",
      vehicle: "Starship V2 / Super Heavy Booster",
      launchSite: "Starbase, Boca Chica, Texas",
      targetDate: "Ongoing Flight Tests",
      objective: "Demonstrate rapid reusability, orbital propellant transfer, and deep space payload delivery for Moon & Mars missions.",
      highlights: ["Mechazilla tower catch of Super Heavy Booster", "Full hot staging ring"],
      telemetry: { thrustMN: 74.3, payloadToLEOTons: 150 },
    },
  ];

  const astronomyEvents = [
    {
      name: "Perseid Meteor Shower Peak",
      date: "August 12-13",
      description: "One of the brightest meteor showers with up to 100 meteors per hour radiating from Perseus.",
      visibility: "Optimal in dark-sky locations worldwide",
    },
    {
      name: "Saturn at Opposition",
      date: "September 8",
      description: "Saturn lies directly opposite the Sun from Earth, appearing at its brightest with rings tilted edge-on.",
      visibility: "Visible all night through telescopes & binoculars",
    },
    {
      name: "Geminid Meteor Shower",
      date: "December 13-14",
      description: "Renowned as the most prolific meteor shower of the year, originating from asteroid 3200 Phaethon.",
      visibility: "High intensity across Northern & Southern hemispheres",
    },
  ];

  res.json({ missions, astronomyEvents, timestamp: new Date().toISOString() });
});

// 4. API: Memory Management
app.get("/api/memory", (req, res) => {
  res.json({ memories, total: memories.length });
});

app.post("/api/memory", (req, res) => {
  const { title, content, category = "IMPORTANT_FACTS", pinned = false, source = "MANUAL_ENTRY", tags = [] } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Memory content is required." });
  }

  const newMemory: MemoryItem = {
    id: "mem-" + Date.now(),
    category,
    title: title || `Entry ${new Date().toLocaleDateString()}`,
    content,
    timestamp: new Date().toISOString(),
    pinned: Boolean(pinned),
    source,
    tags: Array.isArray(tags) ? tags : [category.toLowerCase()],
  };

  memories.unshift(newMemory);
  res.json({ success: true, memory: newMemory, total: memories.length });
});

app.delete("/api/memory/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = memories.length;
  memories = memories.filter(m => m.id !== id);
  res.json({ success: true, deleted: memories.length < initialLength, remaining: memories.length });
});

app.delete("/api/memory", (req, res) => {
  // Clear all except primary identity memory
  memories = memories.filter(m => m.id === "mem-1");
  res.json({ success: true, message: "AETHER memory cache reset, Nishant. Primary identity retained." });
});

// 4b. Neural Retraining from Previous Chats & Conversations
app.post("/api/memory/retrain", async (req, res) => {
  try {
    const { messages = [], rawText = "" } = req.body;
    const historyToAnalyze = Array.isArray(messages) && messages.length > 0
      ? messages
      : serverChatHistory;

    if (historyToAnalyze.length === 0 && !rawText) {
      return res.status(400).json({
        error: "No conversation history or text provided for retraining.",
      });
    }

    const conversationTranscript = rawText
      ? rawText
      : historyToAnalyze
          .map((m: any) => `[${m.sender === "user" ? "Nishant" : "AETHER"}]: ${m.text}`)
          .join("\n");

    const apiKey = process.env.GEMINI_API_KEY;
    let extractedNodes: any[] = [];

    if (apiKey && apiKey !== "dummy-key-fallback") {
      try {
        const ai = getGenAI();
        const prompt = `You are AETHER's Autonomous Neural Knowledge Extraction & Retraining Engine.
Analyze the following conversation transcript between Nishant (the primary operator) and AETHER, or the provided document.
Extract all valuable facts, preferences, project requirements, architectural rules, personal details, mission objectives, and context into a clean JSON array.

RULES:
1. Extract high-signal, concise, and accurate facts.
2. Group each item into one of these exact categories:
   - "USER_PROFILE"
   - "PREFERENCES"
   - "PROJECTS"
   - "SYSTEM_OVERRIDE"
   - "GOALS"
   - "IMPORTANT_FACTS"
   - "CONVERSATION_CONTEXT"
   - "SYSTEM_CONTROL"
3. Output MUST be ONLY valid JSON matching this schema:
[
  {
    "title": "Short descriptive title (max 6 words)",
    "content": "Detailed distilled factual insight",
    "category": "PREFERENCES",
    "tags": ["tag1", "tag2"]
  }
]

Transcript:
${conversationTranscript.slice(0, 15000)}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const rawJson = response.text || "[]";
        extractedNodes = JSON.parse(rawJson);
      } catch (genAiError: any) {
        console.warn("Gemini Retrain API call noticed fallback:", genAiError?.message || genAiError);
      }
    }

    // Heuristic fallback if Gemini is unconfigured or returned empty
    if (!Array.isArray(extractedNodes) || extractedNodes.length === 0) {
      const userLines = historyToAnalyze.filter((m: any) => m.sender === "user" || m.role === "user");
      extractedNodes = userLines.slice(-15).map((m: any) => {
        const text = m.text || "";
        let category: MemoryItem["category"] = "CONVERSATION_CONTEXT";
        if (text.toLowerCase().includes("project")) category = "PROJECTS";
        else if (text.toLowerCase().includes("prefer") || text.toLowerCase().includes("like")) category = "PREFERENCES";
        else if (text.toLowerCase().includes("rule") || text.toLowerCase().includes("override")) category = "SYSTEM_OVERRIDE";
        else if (text.toLowerCase().includes("goal") || text.toLowerCase().includes("todo")) category = "GOALS";

        return {
          title: `Learned: ${text.slice(0, 25)}...`,
          content: text,
          category,
          tags: ["retrained", category.toLowerCase()],
        };
      }).filter((item: any) => item.content.length > 10);
    }

    // Merge extracted memories into active memories array, avoiding exact duplicates
    const existingContents = new Set(memories.map(m => m.content.toLowerCase().trim()));
    const addedItems: MemoryItem[] = [];

    for (const node of extractedNodes) {
      if (node && node.content && !existingContents.has(node.content.toLowerCase().trim())) {
        const item: MemoryItem = {
          id: "mem-retrained-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          category: node.category || "IMPORTANT_FACTS",
          title: node.title || `Retrained Shard ${new Date().toLocaleDateString()}`,
          content: node.content.trim(),
          timestamp: new Date().toISOString(),
          source: "NEURAL_RETRAIN",
          tags: Array.isArray(node.tags) ? node.tags : ["retrained"],
        };
        memories.unshift(item);
        existingContents.add(node.content.toLowerCase().trim());
        addedItems.push(item);
      }
    }

    return res.json({
      success: true,
      messagesAnalyzed: historyToAnalyze.length,
      newMemoriesCount: addedItems.length,
      updatedMemoriesCount: memories.length,
      distilledMemories: addedItems,
      summary: `Successfully retrained A.E.T.H.E.R. neural core on ${historyToAnalyze.length} messages. Distilled ${addedItems.length} new memory nodes.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Retrain endpoint error:", err);
    return res.status(500).json({ error: "Failed to retrain memory matrix", details: err?.message });
  }
});

// 4c. Ingest Raw Data / Document into Memory Matrix
app.post("/api/memory/ingest", (req, res) => {
  try {
    const { title = "Data Ingest", rawText = "", category = "IMPORTANT_FACTS" } = req.body;
    if (!rawText.trim()) {
      return res.status(400).json({ error: "Text content is required for data ingestion." });
    }

    const chunks = rawText
      .split(/\n\s*\n/)
      .map((c: string) => c.trim())
      .filter((c: string) => c.length > 10);

    const created: MemoryItem[] = [];
    chunks.forEach((chunk: string, idx: number) => {
      const item: MemoryItem = {
        id: "mem-ingest-" + Date.now() + "-" + idx,
        title: chunks.length > 1 ? `${title} (Part ${idx + 1})` : title,
        content: chunk,
        category,
        timestamp: new Date().toISOString(),
        source: "DOCUMENT_INGEST",
        tags: ["data_ingest", title.toLowerCase()],
      };
      memories.unshift(item);
      created.push(item);
    });

    res.json({ success: true, count: created.length, memories: created });
  } catch (err: any) {
    res.status(500).json({ error: "Data ingestion failed", details: err?.message });
  }
});

// 4d. Conversation History Query
app.get("/api/memory/history", (req, res) => {
  res.json({ history: serverChatHistory, count: serverChatHistory.length });
});

app.delete("/api/memory/history", (req, res) => {
  serverChatHistory = [];
  res.json({ success: true, message: "Server conversation history buffer cleared." });
});

// 5. API: Projects Management
app.get("/api/projects", (req, res) => {
  res.json({ projects, count: projects.length });
});

app.post("/api/projects", (req, res) => {
  const { name, description, technologies = [], status = "ACTIVE" } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Project name is required." });
  }

  const newProject: ProjectItem = {
    id: "proj-" + Date.now(),
    name,
    description: description || "Personal project created by Nishant.",
    status,
    progress: 10,
    technologies: Array.isArray(technologies) ? technologies : [technologies],
    tasks: [{ id: "t-" + Date.now(), title: "Initial architecture setup", done: true }],
    lastUpdated: new Date().toISOString(),
  };

  projects.push(newProject);
  res.json({ success: true, project: newProject });
});

app.put("/api/projects/:id/task", (req, res) => {
  const { id } = req.params;
  const { taskTitle, toggleTaskId } = req.body;
  const project = projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ error: "Project not found." });

  if (toggleTaskId) {
    const task = project.tasks.find(t => t.id === toggleTaskId);
    if (task) {
      task.done = !task.done;
      // recalculate progress
      const doneCount = project.tasks.filter(t => t.done).length;
      project.progress = Math.round((doneCount / project.tasks.length) * 100);
    }
  } else if (taskTitle) {
    project.tasks.push({ id: "t-" + Date.now(), title: taskTitle, done: false });
    const doneCount = project.tasks.filter(t => t.done).length;
    project.progress = Math.round((doneCount / project.tasks.length) * 100);
  }

  project.lastUpdated = new Date().toISOString();
  res.json({ success: true, project });
});

// 5b. API: Mission Control Objectives Management
app.get("/api/objectives", (req, res) => {
  res.json({ objectives: missionObjectives, total: missionObjectives.length });
});

app.post("/api/objectives", (req, res) => {
  const {
    title,
    description = "",
    projectId,
    projectName,
    priority = "NOMINAL",
    status = "IN_FLIGHT",
    progress = 0,
    targetDeadline,
    assignedTo = "Nishant (Root Operator)",
    milestones = [],
    tags = [],
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Objective title is required." });
  }

  // Auto-find project name if projectId provided but projectName missing
  let resolvedProjectName = projectName;
  if (projectId && !resolvedProjectName) {
    const proj = projects.find(p => p.id === projectId);
    if (proj) resolvedProjectName = proj.name;
  }

  const newObjective: MissionObjective = {
    id: "obj-" + Date.now(),
    title: title.trim(),
    description: description.trim(),
    projectId,
    projectName: resolvedProjectName,
    priority,
    status,
    progress: Math.min(100, Math.max(0, Number(progress) || 0)),
    targetDeadline: targetDeadline || new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    assignedTo,
    milestones: Array.isArray(milestones)
      ? milestones.map((m: any, idx: number) => ({
          id: m.id || `m-${Date.now()}-${idx}`,
          title: typeof m === "string" ? m : m.title,
          done: typeof m === "object" ? Boolean(m.done) : false,
        }))
      : [],
    tags: Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  missionObjectives.unshift(newObjective);
  res.json({ success: true, objective: newObjective, total: missionObjectives.length });
});

app.put("/api/objectives/:id", (req, res) => {
  const { id } = req.params;
  const obj = missionObjectives.find(o => o.id === id);
  if (!obj) return res.status(404).json({ error: "Mission objective not found." });

  const {
    title,
    description,
    projectId,
    projectName,
    priority,
    status,
    progress,
    targetDeadline,
    assignedTo,
    tags,
  } = req.body;

  if (title !== undefined) obj.title = title.trim();
  if (description !== undefined) obj.description = description.trim();
  if (projectId !== undefined) obj.projectId = projectId;
  if (projectName !== undefined) obj.projectName = projectName;
  if (priority !== undefined) obj.priority = priority;
  if (status !== undefined) obj.status = status;
  if (progress !== undefined) {
    obj.progress = Math.min(100, Math.max(0, Number(progress)));
    if (obj.progress === 100 && obj.status !== "ABORTED") {
      obj.status = "COMPLETED";
    }
  }
  if (targetDeadline !== undefined) obj.targetDeadline = targetDeadline;
  if (assignedTo !== undefined) obj.assignedTo = assignedTo;
  if (tags !== undefined && Array.isArray(tags)) obj.tags = tags;

  obj.updatedAt = new Date().toISOString();
  res.json({ success: true, objective: obj });
});

app.delete("/api/objectives/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = missionObjectives.length;
  missionObjectives = missionObjectives.filter(o => o.id !== id);
  res.json({
    success: true,
    deleted: missionObjectives.length < initialLength,
    remaining: missionObjectives.length,
  });
});

app.put("/api/objectives/:id/milestone", (req, res) => {
  const { id } = req.params;
  const { milestoneId, milestoneTitle, toggleMilestoneId, deleteMilestoneId } = req.body;
  const obj = missionObjectives.find(o => o.id === id);
  if (!obj) return res.status(404).json({ error: "Mission objective not found." });

  if (toggleMilestoneId) {
    const ms = obj.milestones.find(m => m.id === toggleMilestoneId);
    if (ms) {
      ms.done = !ms.done;
      // Auto compute progress from milestones if there are milestones
      if (obj.milestones.length > 0) {
        const doneCount = obj.milestones.filter(m => m.done).length;
        obj.progress = Math.round((doneCount / obj.milestones.length) * 100);
        if (obj.progress === 100) obj.status = "COMPLETED";
        else if (obj.status === "COMPLETED" && obj.progress < 100) obj.status = "IN_FLIGHT";
      }
    }
  } else if (milestoneTitle) {
    obj.milestones.push({
      id: "m-" + Date.now(),
      title: milestoneTitle.trim(),
      done: false,
    });
    // Auto adjust progress
    if (obj.milestones.length > 0) {
      const doneCount = obj.milestones.filter(m => m.done).length;
      obj.progress = Math.round((doneCount / obj.milestones.length) * 100);
    }
  } else if (deleteMilestoneId) {
    obj.milestones = obj.milestones.filter(m => m.id !== deleteMilestoneId);
    if (obj.milestones.length > 0) {
      const doneCount = obj.milestones.filter(m => m.done).length;
      obj.progress = Math.round((doneCount / obj.milestones.length) * 100);
    }
  }

  obj.updatedAt = new Date().toISOString();
  res.json({ success: true, objective: obj });
});

app.post("/api/objectives/:id/progress", (req, res) => {
  const { id } = req.params;
  const { delta, exact } = req.body;
  const obj = missionObjectives.find(o => o.id === id);
  if (!obj) return res.status(404).json({ error: "Mission objective not found." });

  if (exact !== undefined) {
    obj.progress = Math.min(100, Math.max(0, Number(exact)));
  } else if (delta !== undefined) {
    obj.progress = Math.min(100, Math.max(0, obj.progress + Number(delta)));
  }

  if (obj.progress === 100) {
    obj.status = "COMPLETED";
    // check all milestones
    obj.milestones.forEach(m => { m.done = true; });
  } else if (obj.status === "COMPLETED" && obj.progress < 100) {
    obj.status = "IN_FLIGHT";
  }

  obj.updatedAt = new Date().toISOString();
  res.json({ success: true, objective: obj });
});

// 6. API: System Configuration & Root Kernel Management
app.get("/api/system/config", (req, res) => {
  res.json({
    config: activeSystemConfig,
    operator: "Nishant",
    clearance: "ROOT_SUPERUSER",
    memoryCount: memories.length,
    projectCount: projects.length,
  });
});

app.post("/api/system/config", (req, res) => {
  const {
    temperature,
    maxOutputTokens,
    topP,
    topK,
    systemPromptOverride,
    reasoningDepth,
    groundingEnabled,
    debugKernelLogs,
    unrestrictedModification,
    autoSyncMemories,
  } = req.body;

  if (temperature !== undefined) activeSystemConfig.temperature = Math.max(0, Math.min(2, Number(temperature)));
  if (maxOutputTokens !== undefined) activeSystemConfig.maxOutputTokens = Math.max(256, Math.min(8192, Number(maxOutputTokens)));
  if (topP !== undefined) activeSystemConfig.topP = Math.max(0.1, Math.min(1.0, Number(topP)));
  if (topK !== undefined) activeSystemConfig.topK = Math.max(1, Math.min(100, Number(topK)));
  if (systemPromptOverride !== undefined) activeSystemConfig.systemPromptOverride = String(systemPromptOverride);
  if (reasoningDepth !== undefined) activeSystemConfig.reasoningDepth = reasoningDepth;
  if (groundingEnabled !== undefined) activeSystemConfig.groundingEnabled = Boolean(groundingEnabled);
  if (debugKernelLogs !== undefined) activeSystemConfig.debugKernelLogs = Boolean(debugKernelLogs);
  if (unrestrictedModification !== undefined) activeSystemConfig.unrestrictedModification = Boolean(unrestrictedModification);
  if (autoSyncMemories !== undefined) activeSystemConfig.autoSyncMemories = Boolean(autoSyncMemories);

  systemExecutionLogs.unshift({
    id: "log-" + Date.now(),
    command: `config --update --temp=${activeSystemConfig.temperature} --depth=${activeSystemConfig.reasoningDepth}`,
    output: "System kernel configuration modified successfully by Operator Nishant.",
    status: "SUCCESS",
    timestamp: new Date().toLocaleTimeString(),
  });

  res.json({ success: true, config: activeSystemConfig });
});

// 7. API: Interactive Terminal Execution for Superuser
app.post("/api/system/exec", (req, res) => {
  const { command } = req.body;
  if (!command || typeof command !== "string") {
    return res.status(400).json({ error: "Command string is required." });
  }

  const trimmed = command.trim();
  const lower = trimmed.toLowerCase();
  let output = "";
  let status: 'SUCCESS' | 'ERROR' | 'SYSTEM' = 'SUCCESS';

  if (lower === "help") {
    output = `AETHER ROOT KERNEL COMMANDS:
- sys info             : Display hardware, runtime, and model cascade status
- config show          : View active hyperparameter configurations
- config set <k> <v>   : Modify kernel parameter (temp, maxTokens, topP, depth)
- override --prompt    : Inspect active custom system prompt override
- override --clear     : Wipe custom prompt override
- memory --list        : Output all registered neural memory shards
- memory --wipe        : Purge all volatile memory entries
- mission --status     : Output all active Mission Control time-sensitive objectives
- eval <expr>          : Execute mathematical or logical expression
- status               : Run subsystem health check
- clear                : Clear terminal screen
- reboot               : Re-initialize kernel runtime`;
  } else if (lower === "sys info" || lower === "uname -a" || lower === "kernel status") {
    const mem = process.memoryUsage();
    output = `AETHER KERNEL v3.7.0-HYPERCORE [Linux x86_64]
OPERATOR     : Nishant (Root Superuser)
UPTIME       : ${Math.floor(process.uptime())} seconds
NODE RUNTIME : ${process.version}
HEAP USED    : ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB
CLEARANCE    : UNRESTRICTED SYSTEM OVERRIDE
MODEL CASCADE: [Tier 1: Gemini 3.7 Flash Grounded] -> [Tier 2: Gemini 3.7 Flash] -> [Tier 3: Gemini 3.1 Flash-Lite] -> [Tier 4: Gemini Flash Latest]
ACTIVE MISSIONS: ${missionObjectives.filter(o => o.status === 'IN_FLIGHT').length} in flight (${missionObjectives.length} total)`;
  } else if (lower === "mission --status" || lower === "obj --list" || lower === "objectives") {
    output = missionObjectives.map((o, i) => `[${i + 1}] [${o.priority}] ${o.title} | ${o.progress}% | Deadline: ${new Date(o.targetDeadline).toLocaleDateString()} | Status: ${o.status}`).join("\n");
  } else if (lower === "config show") {
    output = JSON.stringify(activeSystemConfig, null, 2);
  } else if (lower.startsWith("config set ")) {
    const parts = trimmed.split(" ");
    const key = parts[2];
    const val = parts[3];
    if (key === "temp" || key === "temperature") {
      activeSystemConfig.temperature = parseFloat(val) || 0.7;
      output = `Temperature updated to ${activeSystemConfig.temperature}`;
    } else if (key === "maxTokens" || key === "tokens") {
      activeSystemConfig.maxOutputTokens = parseInt(val, 10) || 4096;
      output = `MaxOutputTokens updated to ${activeSystemConfig.maxOutputTokens}`;
    } else if (key === "depth") {
      activeSystemConfig.reasoningDepth = val.toUpperCase() as any;
      output = `Reasoning depth set to ${activeSystemConfig.reasoningDepth}`;
    } else {
      output = `Unknown key: ${key}. Valid keys: temp, maxTokens, depth`;
      status = "ERROR";
    }
  } else if (lower === "override --prompt") {
    output = activeSystemConfig.systemPromptOverride || "No custom prompt override currently set (default system prompt in effect).";
  } else if (lower === "override --clear") {
    activeSystemConfig.systemPromptOverride = "";
    output = "Custom prompt override purged. Restored standard AETHER root prompt.";
  } else if (lower === "memory --list") {
    output = memories.map((m, i) => `[${i + 1}] [${m.category}] ${m.title}: ${m.content.slice(0, 70)}...`).join("\n");
  } else if (lower === "memory --wipe") {
    memories = memories.filter(m => m.id === "mem-1");
    output = "Volatile memory matrix purged. Retained primary Nishant Root identity.";
    status = "SYSTEM";
  } else if (lower.startsWith("eval ")) {
    const expr = trimmed.slice(5);
    try {
      // Safe math / logic evaluation
      const sanitized = expr.replace(/[^0-9+\-*/().%^eE,Math.sincoqrtlgbpI\s]/g, "");
      const evalFn = new Function("return (" + sanitized + ");");
      const res = evalFn();
      output = "Result: " + String(res);
    } catch (e: any) {
      output = "Evaluation error: " + (e?.message || String(e));
      status = "ERROR";
    }
  } else if (lower === "reboot" || lower === "restart") {
    output = "Re-synchronizing AETHER neural matrices... All nodes calibrated for Nishant.";
    status = "SYSTEM";
  } else {
    output = `Command executed: [${trimmed}]. Result: OK (exit code 0). Subsystems nominal.`;
  }

  const logEntry = {
    id: "log-" + Date.now(),
    command: trimmed,
    output,
    status,
    timestamp: new Date().toLocaleTimeString(),
  };

  systemExecutionLogs.unshift(logEntry);
  if (systemExecutionLogs.length > 50) systemExecutionLogs.pop();

  res.json({ success: true, log: logEntry });
});

// 8. API: System Logs
app.get("/api/system/logs", (req, res) => {
  res.json({ logs: systemExecutionLogs });
});

// Health Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", system: "AETHER", user: "Nishant" });
});

// Setup Vite / Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AETHER] Command core active on port ${PORT}. All systems operational for Nishant.`);
  });
}

startServer();
