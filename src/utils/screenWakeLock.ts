/**
 * Always-On Screen & Wake Lock Manager for A.E.T.H.E.R.
 * Prevents system display from entering sleep mode or dimming during operation.
 */

const STORAGE_KEY_WAKE_LOCK = 'aether_always_on_screen_lock_v1';

export type WakeLockMode = 'NATIVE_WAKELOCK' | 'MICRO_RENDER_FALLBACK' | 'DISABLED';

export interface WakeLockState {
  isActive: boolean;
  isSupported: boolean;
  mode: WakeLockMode;
  lastAcquiredAt?: string;
  error?: string | null;
}

type WakeLockListener = (state: WakeLockState) => void;
const listeners = new Set<WakeLockListener>();

let wakeLockSentinel: any = null;
let microRenderInterval: any = null;
let isUserPreferredEnabled = true;

// Initial state
const currentState: WakeLockState = {
  isActive: false,
  isSupported: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
  mode: 'DISABLED',
  lastAcquiredAt: undefined,
  error: null,
};

function notifyListeners() {
  const snapshot = { ...currentState };
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // safe broadcast
    }
  });
}

export function subscribeToWakeLock(listener: WakeLockListener): () => void {
  listeners.add(listener);
  listener({ ...currentState });
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Check if the browser natively supports the Screen Wake Lock API
 */
export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

/**
 * Get current screen wake lock state snapshot
 */
export function getWakeLockState(): WakeLockState {
  return { ...currentState };
}

/**
 * Request Screen Wake Lock (Prevent screen from sleeping)
 */
export async function requestScreenWakeLock(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Try Native W3C Screen Wake Lock API
  if (isWakeLockSupported()) {
    try {
      // Release any existing lock before re-requesting
      if (wakeLockSentinel && !wakeLockSentinel.released) {
        await wakeLockSentinel.release().catch(() => {});
      }

      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');

      currentState.isActive = true;
      currentState.mode = 'NATIVE_WAKELOCK';
      currentState.lastAcquiredAt = new Date().toISOString();
      currentState.error = null;

      wakeLockSentinel.addEventListener('release', () => {
        // Only mark inactive if not intentionally re-acquired
        if (wakeLockSentinel && wakeLockSentinel.released) {
          currentState.isActive = false;
          currentState.mode = 'DISABLED';
          notifyListeners();
        }
      });

      notifyListeners();
      return true;
    } catch (err: any) {
      console.warn('Native Wake Lock request failed:', err?.message || err);
      currentState.error = err?.message || 'Native wake lock unavailable';
    }
  }

  // 2. Fallback: Micro-render keep-alive loop (prevents background throttle/sleep in unsupported contexts)
  try {
    startMicroRenderFallback();
    currentState.isActive = true;
    currentState.mode = 'MICRO_RENDER_FALLBACK';
    currentState.lastAcquiredAt = new Date().toISOString();
    notifyListeners();
    return true;
  } catch (err: any) {
    currentState.isActive = false;
    currentState.mode = 'DISABLED';
    currentState.error = err?.message || 'Wake lock fallback failed';
    notifyListeners();
    return false;
  }
}

/**
 * Release Screen Wake Lock
 */
export async function releaseScreenWakeLock(): Promise<void> {
  stopMicroRenderFallback();

  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // safe release
    }
    wakeLockSentinel = null;
  }

  currentState.isActive = false;
  currentState.mode = 'DISABLED';
  currentState.error = null;
  notifyListeners();
}

/**
 * Toggle Screen Wake Lock state and persist user preference
 */
export async function toggleScreenWakeLock(): Promise<boolean> {
  const next = !currentState.isActive;
  isUserPreferredEnabled = next;
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_WAKE_LOCK, next ? 'true' : 'false');
    } catch {
      // ignore
    }
  }

  if (next) {
    return await requestScreenWakeLock();
  } else {
    await releaseScreenWakeLock();
    return false;
  }
}

/**
 * Micro-render animation frame loop to prevent sleep in non-wakeLock browsers
 */
function startMicroRenderFallback() {
  if (microRenderInterval) clearInterval(microRenderInterval);

  // Subtle 15-second heartbeat ping
  microRenderInterval = setInterval(() => {
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        // No-op paint request keeps render pipeline alive
      });
    }
  }, 15000);
}

function stopMicroRenderFallback() {
  if (microRenderInterval) {
    clearInterval(microRenderInterval);
    microRenderInterval = null;
  }
}

/**
 * Initialize auto-wake lock and attach lifecycle listeners (e.g. visibility change, click)
 */
export function initScreenWakeLock(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Check saved user preference (defaults to true)
  const saved = localStorage.getItem(STORAGE_KEY_WAKE_LOCK);
  isUserPreferredEnabled = saved !== null ? saved === 'true' : true;

  if (isUserPreferredEnabled) {
    requestScreenWakeLock().catch(() => {});
  }

  // Handle Tab / Window Visibility Change:
  // Browsers automatically release wake locks when switching tabs or minimizing.
  // Re-acquire automatically when returning to the AETHER tab!
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && isUserPreferredEnabled) {
      requestScreenWakeLock().catch(() => {});
    }
  };

  // Re-attempt on initial user interaction (bypasses autoplay/gesture permission restrictions)
  const handleUserInteraction = () => {
    if (isUserPreferredEnabled && !currentState.isActive) {
      requestScreenWakeLock().catch(() => {});
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('click', handleUserInteraction, { once: true });
  window.addEventListener('touchstart', handleUserInteraction, { once: true });

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('click', handleUserInteraction);
    window.removeEventListener('touchstart', handleUserInteraction);
    releaseScreenWakeLock().catch(() => {});
  };
}
