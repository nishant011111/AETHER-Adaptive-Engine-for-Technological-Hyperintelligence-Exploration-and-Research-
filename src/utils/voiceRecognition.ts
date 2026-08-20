/**
 * A.E.T.H.E.R. — High-Resilience Autonomous Voice Recognition Engine
 * 
 * Features:
 * 1. Web Speech API (Chrome, Edge, Safari WebKit) with continuous interim streaming.
 * 2. MediaRecorder & Gemini Multimodal Audio Fallback (/api/transcribe-audio).
 * 3. Real-time microphone audio analyzer (live RMS/VU meter).
 * 4. Automatic error recovery and permission acquisition.
 */

export interface VoiceEngineCallbacks {
  onStart?: () => void;
  onInterim?: (interimText: string) => void;
  onFinal?: (finalText: string) => void;
  onError?: (error: string, code?: string) => void;
  onEnd?: () => void;
  onVolumeChange?: (rmsVolume: number) => void; // 0 - 100
}

export class ResilientVoiceController {
  private static instance: ResilientVoiceController | null = null;
  private recognition: any = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private isListeningState = false;
  private isFallbackMode = false;
  private currentFinalTranscript = '';
  private callbacks: VoiceEngineCallbacks = {};
  private silenceTimer: any = null;
  private hasReceivedSpeech = false;

  private constructor() {
    this.initWebSpeech();
  }

  public static getInstance(): ResilientVoiceController {
    if (!ResilientVoiceController.instance) {
      ResilientVoiceController.instance = new ResilientVoiceController();
    }
    return ResilientVoiceController.instance;
  }

  public setCallbacks(cb: VoiceEngineCallbacks) {
    this.callbacks = { ...this.callbacks, ...cb };
  }

  private initWebSpeech() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          this.isListeningState = true;
          this.hasReceivedSpeech = false;
          this.currentFinalTranscript = '';
          if (this.callbacks.onStart) this.callbacks.onStart();
        };

        rec.onresult = (event: any) => {
          let interim = '';
          let newlyFinalized = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              newlyFinalized += transcript;
            } else {
              interim += transcript;
            }
          }

          if (newlyFinalized) {
            this.currentFinalTranscript += (this.currentFinalTranscript ? ' ' : '') + newlyFinalized.trim();
            this.hasReceivedSpeech = true;
            if (this.callbacks.onInterim) {
              this.callbacks.onInterim(this.currentFinalTranscript);
            }
            this.resetSilenceTimer();
          } else if (interim) {
            this.hasReceivedSpeech = true;
            const fullInterim = (this.currentFinalTranscript ? this.currentFinalTranscript + ' ' : '') + interim.trim();
            if (this.callbacks.onInterim) {
              this.callbacks.onInterim(fullInterim);
            }
            this.resetSilenceTimer();
          }
        };

        rec.onerror = async (event: any) => {
          const err = event?.error || 'unknown';
          console.warn('[AETHER Voice Engine] WebSpeech Notice:', err);

          // If network error or service not allowed (common in sandboxed iframes), auto switch to MediaRecorder + Gemini STT
          if (err === 'network' || err === 'service-not-allowed' || err === 'audio-capture') {
            console.log('[AETHER Voice Engine] Activating Gemini Multimodal Audio Fallback...');
            this.isFallbackMode = true;
          } else if (err === 'not-allowed') {
            if (this.callbacks.onError) {
              this.callbacks.onError('Microphone permission was denied. Please allow microphone access.', 'not-allowed');
            }
          }
        };

        rec.onend = () => {
          // If still marked as listening and no speech captured yet, restart or finalize
          if (this.isListeningState) {
            if (this.currentFinalTranscript.trim()) {
              this.dispatchFinalResult(this.currentFinalTranscript.trim());
            } else {
              this.stop();
            }
          }
        };

        this.recognition = rec;
      } catch (e) {
        console.warn('[AETHER Voice Engine] WebSpeech initialization failed:', e);
        this.recognition = null;
      }
    }
  }

  private resetSilenceTimer() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    // After 1.6 seconds of silence following speech, automatically finalize and dispatch
    this.silenceTimer = setTimeout(() => {
      if (this.isListeningState && this.currentFinalTranscript.trim()) {
        this.stop();
      }
    }, 1600);
  }

  /**
   * Starts listening with user-gesture microphone permission acquisition
   */
  public async start(): Promise<boolean> {
    this.currentFinalTranscript = '';
    this.hasReceivedSpeech = false;
    this.audioChunks = [];

    // 1. Request microphone stream and setup live VU meter
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.setupAudioAnalyser(this.mediaStream);
        this.setupMediaRecorder(this.mediaStream);
      }
    } catch (err: any) {
      console.warn('[AETHER Voice Engine] getUserMedia prompt declined or unavailable:', err);
      if (this.callbacks.onError) {
        this.callbacks.onError('Microphone access is required for voice control. Please allow microphone in browser.', 'not-allowed');
      }
      return false;
    }

    // 2. Start Web Speech API if available
    this.isListeningState = true;
    let webSpeechStarted = false;

    if (this.recognition) {
      try {
        this.recognition.abort(); // Cancel any lingering instance
      } catch {}

      try {
        this.recognition.start();
        webSpeechStarted = true;
      } catch (err: any) {
        console.warn('[AETHER Voice Engine] recognition.start error, fallback engaged:', err);
      }
    }

    // 3. Always start MediaRecorder as parallel safeguard
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      try {
        this.mediaRecorder.start(250);
      } catch (e) {
        console.warn('[AETHER Voice Engine] MediaRecorder start error:', e);
      }
    }

    if (this.callbacks.onStart) {
      this.callbacks.onStart();
    }

    return true;
  }

  private setupAudioAnalyser(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!this.isListeningState || !this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));

        if (this.callbacks.onVolumeChange) {
          this.callbacks.onVolumeChange(normalized);
        }

        this.animFrameId = requestAnimationFrame(updateVolume);
      };

      this.animFrameId = requestAnimationFrame(updateVolume);
    } catch (e) {
      console.warn('[AETHER Voice Engine] Audio analyser setup notice:', e);
    }
  }

  private setupMediaRecorder(stream: MediaStream) {
    try {
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      this.mediaRecorder = recorder;
      this.audioChunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // If WebSpeech did not produce a transcript, transcribe the recorded audio via Gemini!
        if (!this.currentFinalTranscript.trim() && this.audioChunks.length > 0) {
          const mime = recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: mime });
          if (audioBlob.size > 2000) {
            await this.transcribeAudioBlob(audioBlob, mime);
          }
        }
      };
    } catch (e) {
      console.warn('[AETHER Voice Engine] MediaRecorder setup error:', e);
    }
  }

  private async transcribeAudioBlob(blob: Blob, mimeType: string) {
    try {
      if (this.callbacks.onInterim) {
        this.callbacks.onInterim('Transcribing audio via Gemini Hypercore...');
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const dataUrl = await base64Promise;

      const res = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: dataUrl,
          mimeType: mimeType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.transcript && data.transcript.trim()) {
          this.dispatchFinalResult(data.transcript.trim());
          return;
        }
      }
    } catch (e) {
      console.warn('[AETHER Voice Engine] Gemini audio transcription error:', e);
    }

    if (this.callbacks.onEnd) {
      this.callbacks.onEnd();
    }
  }

  private dispatchFinalResult(text: string) {
    if (this.callbacks.onFinal && text) {
      this.callbacks.onFinal(text);
    }
    if (this.callbacks.onEnd) {
      this.callbacks.onEnd();
    }
  }

  /**
   * Stops listening cleanly and flushes results
   */
  public stop() {
    this.isListeningState = false;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.currentFinalTranscript.trim()) {
      const finalVal = this.currentFinalTranscript.trim();
      this.currentFinalTranscript = '';
      this.dispatchFinalResult(finalVal);
    } else {
      if (this.callbacks.onEnd) {
        this.callbacks.onEnd();
      }
    }
  }

  public isListening(): boolean {
    return this.isListeningState;
  }
}
