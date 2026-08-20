import { ClientTelemetry, ServerTelemetry } from '../types';

const CLIENT_TELEMETRY_CACHE_KEY = 'aether_client_telemetry_cache';
const SERVER_TELEMETRY_CACHE_KEY = 'aether_server_telemetry_cache';

export function getCachedClientTelemetry(): ClientTelemetry {
  if (typeof window === 'undefined') return {};
  try {
    const cached = localStorage.getItem(CLIENT_TELEMETRY_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('Telemetry client cache read notice:', err);
  }
  return {
    cores: 8,
    memoryGB: 16,
    networkType: '4g',
    batteryLevel: 98,
    batteryCharging: true,
  };
}

export function saveCachedClientTelemetry(data: ClientTelemetry): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLIENT_TELEMETRY_CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Telemetry client cache save notice:', err);
  }
}

export function getCachedServerTelemetry(): ServerTelemetry | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(SERVER_TELEMETRY_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('Telemetry server cache read notice:', err);
  }
  return {
    status: 'ONLINE (CACHED)',
    agent: 'A.E.T.H.E.R.',
    user: 'NISHANT',
    version: '3.7.0-HYPERCORE',
    platform: 'linux',
    arch: 'x64',
    nodeVersion: 'v20.x',
    uptimeSeconds: 3600,
    memory: {
      rssMB: '48.2',
      heapTotalMB: '32.1',
      heapUsedMB: '24.6',
    },
    activeProtocols: ['NEURAL_CORE', 'VOICE_SYNTHESIS', 'SPACE_TELEMETRY', 'MEMORY_MATRIX', 'GPS_TACTICAL_MAP'],
    timestamp: new Date().toISOString(),
  };
}

export function saveCachedServerTelemetry(data: ServerTelemetry): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SERVER_TELEMETRY_CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Telemetry server cache save notice:', err);
  }
}

export const getClientTelemetry = fetchClientTelemetry;
export async function fetchClientTelemetry(): Promise<ClientTelemetry> {
  const telemetry: ClientTelemetry = getCachedClientTelemetry();

  if (typeof window === 'undefined') return telemetry;

  // 1. Hardware Concurrency (CPU logical cores)
  if (navigator.hardwareConcurrency) {
    telemetry.cores = navigator.hardwareConcurrency;
  }

  // 2. Device Memory (approximate RAM in GB)
  if ((navigator as any).deviceMemory) {
    telemetry.memoryGB = (navigator as any).deviceMemory;
  }

  // 3. Network Information
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    telemetry.networkType = connection.effectiveType || connection.type || 'standard';
    if (connection.downlink) {
      telemetry.downlinkMbps = connection.downlink;
    }
    if (connection.rtt) {
      telemetry.rttMs = connection.rtt;
    }
  }

  // 4. Battery Status
  if ((navigator as any).getBattery) {
    try {
      const battery = await (navigator as any).getBattery();
      if (battery) {
        telemetry.batteryLevel = Math.round(battery.level * 100);
        telemetry.batteryCharging = battery.charging;
      }
    } catch {
      // Battery API fallback
    }
  }

  // 5. Storage Estimate
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage) {
        telemetry.storageUsedMB = Math.round(estimate.usage / (1024 * 1024));
      }
      if (estimate.quota) {
        telemetry.storageQuotaMB = Math.round(estimate.quota / (1024 * 1024));
      }
    } catch {
      // Storage estimation fallback
    }
  }

  telemetry.userAgent = navigator.userAgent;

  // Save to cache
  saveCachedClientTelemetry(telemetry);

  return telemetry;
}
