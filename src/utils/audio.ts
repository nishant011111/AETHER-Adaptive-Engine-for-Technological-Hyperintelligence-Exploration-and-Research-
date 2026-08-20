/**
 * Audio Synthesis, Holographic Vocal Waveform Engine & HUD Sound FX for A.E.T.H.E.R.
 */

let audioCtx: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let speakingStatus = false;
let waveformInterval: any = null;
let currentAmplitude = 0;

// Subscribed listeners for real-time waveform updates
type WaveformListener = (bands: number[], amplitude: number, isSpeaking: boolean) => void;
const waveformListeners = new Set<WaveformListener>();

export function subscribeToWaveform(listener: WaveformListener): () => void {
  waveformListeners.add(listener);
  return () => {
    waveformListeners.delete(listener);
  };
}

function notifyWaveformListeners(bands: number[], amplitude: number, isSpeaking: boolean) {
  waveformListeners.forEach((listener) => {
    try {
      listener(bands, amplitude, isSpeaking);
    } catch {
      // safe broadcast
    }
  });
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 64;
      analyserNode.smoothingTimeConstant = 0.8;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Generates dynamic reactive holographic waveform frequency bands
 */
function startWaveformSimulation() {
  if (waveformInterval) clearInterval(waveformInterval);

  let phase = 0;
  waveformInterval = setInterval(() => {
    if (!speakingStatus) {
      // Idle ambient baseline
      phase += 0.08;
      const idleBands = Array.from({ length: 24 }, (_, i) => {
        const base = Math.sin(phase + i * 0.4) * 8 + 12;
        return Math.max(6, Math.min(28, Math.round(base)));
      });
      currentAmplitude = 12;
      notifyWaveformListeners(idleBands, 12, false);
      return;
    }

    // Active Vocal Waveform generation reacting to prosody, syllables, and speech modulation
    phase += 0.22;
    const syllabicModulation = Math.sin(phase * 2.5) * 0.35 + 0.65;
    const phonemeBurst = Math.random() > 0.6 ? 1.25 : 0.9;
    const amp = Math.min(100, Math.max(25, Math.round((Math.sin(phase * 4) * 25 + 65) * syllabicModulation * phonemeBurst)));
    currentAmplitude = amp;

    const bands = Array.from({ length: 24 }, (_, i) => {
      // Formant frequency peaks in mid-range (human vocal resonance)
      const centerFactor = 1 - Math.abs(i - 11) / 13;
      const harmonic = Math.sin(phase * 3 + i * 0.6) * 20;
      const noise = (Math.random() - 0.5) * 15;
      const val = (amp * centerFactor * 0.9) + harmonic + noise;
      return Math.max(10, Math.min(100, Math.round(val)));
    });

    notifyWaveformListeners(bands, amp, true);
  }, 45);
}

// Start baseline visualizer loop immediately
if (typeof window !== 'undefined') {
  startWaveformSimulation();
}

export type SoundEffectType =
  | 'beep'
  | 'chime'
  | 'pulse'
  | 'boot'
  | 'error'
  | 'click'
  | 'radar'
  | 'warp'
  | 'spectral_drone'
  | 'emf_crackle'
  | 'exorcism_strike'
  | 'ghost_whisper'
  | 'breach_alarm';

/**
 * Futuristic sci-fi & paranormal sound effects generated purely via Web Audio synthesizer
 */
export function playSound(type: SoundEffectType) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    if (analyserNode) {
      gain.connect(analyserNode);
      analyserNode.connect(ctx.destination);
    } else {
      gain.connect(ctx.destination);
    }

    switch (type) {
      case 'spectral_drone': {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, now); // Low A1 demonic sub-drone
        osc.frequency.linearRampToValueAtTime(58.27, now + 0.4); // Tritone micro-detune
        osc.frequency.linearRampToValueAtTime(55, now + 0.8);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.start(now);
        osc.stop(now + 0.9);
        break;
      }

      case 'emf_crackle': {
        // High frequency static burst
        osc.type = 'square';
        osc.frequency.setValueAtTime(800 + Math.random() * 600, now);
        osc.frequency.setValueAtTime(300 + Math.random() * 400, now + 0.03);
        osc.frequency.setValueAtTime(1200 + Math.random() * 800, now + 0.06);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      case 'exorcism_strike': {
        // Holy resonant multi-tone chime chord
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.3); // Octave upward burst
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.start(now);
        osc.stop(now + 0.65);

        // Harmonic overtone
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.5, now); // E6
        gain2.gain.setValueAtTime(0.08, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.7);
        break;
      }

      case 'ghost_whisper': {
        // Eerie reversed spectral flutter
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.linearRampToValueAtTime(440, now + 0.15);
        osc.frequency.linearRampToValueAtTime(293.66, now + 0.35);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.linearRampToValueAtTime(0.07, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }

      case 'breach_alarm': {
        // Urgent demonic breach tritone siren
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(466.16, now); // Bb4
        osc.frequency.linearRampToValueAtTime(329.63, now + 0.18); // E4 (Devil's Tritone)
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.start(now);
        osc.stop(now + 0.38);
        break;
      }

      case 'beep':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'chime':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
        osc.frequency.setValueAtTime(1046.5, now + 0.12); // C6
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      case 'pulse':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'radar':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.2);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'warp':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.3);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      case 'boot':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
        break;

      case 'error':
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(180, now + 0.1);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
        break;
    }
  } catch {
    // Non-blocking sound fx
  }
}

/**
 * Text-to-Speech synthesis with real-time vocal amplitude synchronization
 */
export function speakText(
  text: string,
  options?: {
    voiceName?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  // Cancel any active utterance immediately (supports instant interruption / barge-in)
  stopSpeaking();

  // Strip complex markdown headers/symbols and code blocks for spoken clarity, and normalize pronunciation
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#+\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[■□►▲▼◆]/g, '')
    .replace(/\\\[[\s\S]*?\\\]/g, 'mathematical expression')
    .replace(/\\\([\s\S]*?\\\)/g, 'formula')
    // Guarantee phonetic pronunciation as the single fluid word "Aether"
    .replace(/A\.E\.T\.H\.E\.R\.?/gi, 'Aether')
    .replace(/A\.\s*E\.\s*T\.\s*H\.\s*E\.\s*R\.?/gi, 'Aether')
    .replace(/\bAETHER\b/g, 'Aether')
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = options?.rate ?? 1.05;
  utterance.pitch = options?.pitch ?? 1.0;
  utterance.volume = options?.volume ?? 1.0;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    if (options?.voiceName) {
      const selected = voices.find((v) => v.name === options.voiceName);
      if (selected) utterance.voice = selected;
    } else {
      // Find a crisp English voice
      const preferred = voices.find(
        (v) =>
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Alex') || v.name.includes('Microsoft David')) &&
          v.lang.startsWith('en')
      );
      if (preferred) utterance.voice = preferred;
    }
  }

  utterance.onstart = () => {
    speakingStatus = true;
    activeUtterance = utterance;
    if (options?.onStart) options.onStart();
  };

  // Word & sentence boundary reactivity for realistic amplitude leaps
  utterance.onboundary = () => {
    currentAmplitude = Math.min(100, Math.round(currentAmplitude * 1.3));
  };

  const handleFinish = () => {
    speakingStatus = false;
    activeUtterance = null;
    if (options?.onEnd) options.onEnd();
  };

  utterance.onend = handleFinish;
  utterance.onerror = (e) => {
    console.warn('Speech synthesis notice:', e);
    speakingStatus = false;
    activeUtterance = null;
    if (options?.onError) options.onError();
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function isSpeakingNow(): boolean {
  return speakingStatus || (typeof window !== 'undefined' && window.speechSynthesis?.speaking);
}

export function getCurrentAmplitude(): number {
  return currentAmplitude;
}

export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }
    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
      resolve(voices);
    };
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 500);
  });
}

export function stopSpeaking() {
  speakingStatus = false;
  activeUtterance = null;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
