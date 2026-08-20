import { BiometricSecurityLog, BiometricAuthStatus, AuthMethod } from '../types';

const STORAGE_KEY_BIOMETRIC_LOGS = 'aether_biometric_security_logs_v1';

export const INITIAL_BIOMETRIC_SECURITY_LOGS: BiometricSecurityLog[] = [
  {
    id: 'bio-log-1001',
    timestamp: new Date(Date.now() - 1000 * 60 * 125).toISOString(),
    status: 'SUCCESS',
    method: 'BIOMETRIC_PASSKEY',
    operatorIdentifier: 'wwwnishant.com0@gmail.com (Operator Nishant)',
    authenticatorType: 'Platform Authenticator (TouchID / Windows Hello / Hardware Enclave)',
    userVerification: 'verified',
    credentialId: 'cred_pk_9a87f2e14b5c77d0',
    challengeHash: '0x4f8812c9b4e8...3a91',
    origin: typeof window !== 'undefined' ? window.location.origin : 'https://aether.system.internal',
    rpId: typeof window !== 'undefined' ? window.location.hostname : 'aether-security-core',
    latencyMs: 142,
    securityTier: 'LEVEL 5 - FIDO2 / WEBAUTHN HARDWARE ENCLAVE',
    ipMock: '127.0.0.1 (Local Enclave Bus)',
  },
  {
    id: 'bio-log-1002',
    timestamp: new Date(Date.now() - 1000 * 60 * 68).toISOString(),
    status: 'USER_CANCELLED',
    method: 'BIOMETRIC_PASSKEY',
    operatorIdentifier: 'wwwnishant.com0@gmail.com (Operator Nishant)',
    authenticatorType: 'Platform Authenticator',
    userVerification: 'failed',
    challengeHash: '0x7b233a1e90c1...d4e2',
    origin: typeof window !== 'undefined' ? window.location.origin : 'https://aether.system.internal',
    rpId: typeof window !== 'undefined' ? window.location.hostname : 'aether-security-core',
    latencyMs: 3200,
    failureReason: 'NotAllowedError: The operation either timed out or was not allowed by user interaction.',
    securityTier: 'LEVEL 5 - WEBAUTHN HARDWARE INTERRUPT',
    ipMock: '127.0.0.1 (Local Enclave Bus)',
  },
  {
    id: 'bio-log-1003',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    status: 'SUCCESS',
    method: 'GOOGLE_OAUTH',
    operatorIdentifier: 'wwwnishant.com0@gmail.com',
    authenticatorType: 'Google Identity Services (OAuth 2.0 PKCE + Tasks Scope)',
    userVerification: 'verified',
    credentialId: 'oauth_gsi_token_session_verified',
    challengeHash: '0x99e821fa55b2...88cc',
    origin: typeof window !== 'undefined' ? window.location.origin : 'https://aether.system.internal',
    rpId: 'accounts.google.com',
    latencyMs: 840,
    securityTier: 'LEVEL 5 - WORKSPACE OAUTH 2.0 TOKEN',
    ipMock: '127.0.0.1 (Ingress Proxy)',
  },
  {
    id: 'bio-log-1004',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    status: 'SUCCESS',
    method: 'OPERATOR_OVERRIDE',
    operatorIdentifier: 'op_nishant_aether_prime (Nishant)',
    authenticatorType: 'Master Root Key Clearance',
    userVerification: 'verified',
    credentialId: 'root_override_token_prime',
    challengeHash: '0xff12903348ab...7710',
    origin: typeof window !== 'undefined' ? window.location.origin : 'https://aether.system.internal',
    rpId: 'aether-security-core',
    latencyMs: 25,
    securityTier: 'LEVEL 5 - PRIME OVERRIDE CLEARANCE',
    ipMock: '127.0.0.1 (Kernel Direct)',
  },
];

export class SecurityLogService {
  static getLogs(): BiometricSecurityLog[] {
    if (typeof window === 'undefined') return INITIAL_BIOMETRIC_SECURITY_LOGS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BIOMETRIC_LOGS);
      if (!raw) {
        this.saveLogs(INITIAL_BIOMETRIC_SECURITY_LOGS);
        return INITIAL_BIOMETRIC_SECURITY_LOGS;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_BIOMETRIC_SECURITY_LOGS;
    } catch {
      return INITIAL_BIOMETRIC_SECURITY_LOGS;
    }
  }

  static saveLogs(logs: BiometricSecurityLog[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_BIOMETRIC_LOGS, JSON.stringify(logs.slice(0, 200)));
    } catch (e) {
      console.warn('Failed to persist biometric security logs:', e);
    }
  }

  static addLog(
    entry: Omit<BiometricSecurityLog, 'id' | 'timestamp'> & { timestamp?: string }
  ): BiometricSecurityLog {
    const current = this.getLogs();
    const newLog: BiometricSecurityLog = {
      id: `bio-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      ...entry,
    };
    const updated = [newLog, ...current];
    this.saveLogs(updated);
    return newLog;
  }

  static clearLogs(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY_BIOMETRIC_LOGS);
    } catch {
      // Ignore
    }
  }

  /**
   * Directly test the WebAuthn platform authenticator and record telemetry
   */
  static async testWebAuthnProbe(): Promise<BiometricSecurityLog> {
    const startTime = performance.now();
    const isBrowserSupported = typeof window !== 'undefined' && !!window.PublicKeyCredential;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aether.system.internal';
    const rpId = typeof window !== 'undefined' ? window.location.hostname : 'aether-security-core';

    if (!isBrowserSupported) {
      const log = this.addLog({
        status: 'UNSUPPORTED_HARDWARE',
        method: 'WEBAUTHN_GATE_PROBE',
        operatorIdentifier: 'wwwnishant.com0@gmail.com (Operator Nishant)',
        authenticatorType: 'No WebAuthn API Detected',
        userVerification: 'failed',
        failureReason: 'Browser runtime does not implement window.PublicKeyCredential API.',
        latencyMs: Math.round(performance.now() - startTime),
        origin,
        rpId,
        securityTier: 'LEVEL 5 - INCOMPATIBLE SENSOR',
      });
      return log;
    }

    try {
      const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        const log = this.addLog({
          status: 'UNSUPPORTED_HARDWARE',
          method: 'WEBAUTHN_GATE_PROBE',
          operatorIdentifier: 'wwwnishant.com0@gmail.com (Operator Nishant)',
          authenticatorType: 'Platform Authenticator Not Available',
          userVerification: 'failed',
          failureReason: 'Platform authenticator (TouchID / FaceID / Windows Hello) unavailable in current sandbox/device.',
          latencyMs: Math.round(performance.now() - startTime),
          origin,
          rpId,
          securityTier: 'LEVEL 5 - WEBAUTHN HARDWARE PROBE',
        });
        return log;
      }

      // Perform a non-blocking test creation/query
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'A.E.T.H.E.R. Security Probe', id: rpId },
          user: {
            id: userId,
            name: 'wwwnishant.com0@gmail.com',
            displayName: 'Operator Nishant (Diagnostic Probe)',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
          },
          timeout: 30000,
        },
      });

      const latency = Math.round(performance.now() - startTime);

      if (credential) {
        const log = this.addLog({
          status: 'SUCCESS',
          method: 'WEBAUTHN_GATE_PROBE',
          operatorIdentifier: 'wwwnishant.com0@gmail.com (Operator Nishant)',
          authenticatorType: 'Platform Authenticator (Hardware Enclave Verified)',
          userVerification: 'verified',
          credentialId: `cred_diag_${credential.id.slice(0, 16)}`,
          challengeHash: `0x${Array.from(challenge.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('')}...`,
          origin,
          rpId,
          latencyMs: latency,
          securityTier: 'LEVEL 5 - FIDO2 / WEBAUTHN HARDWARE ENCLAVE',
        });
        return log;
      } else {
        throw new Error('Credential generation returned empty descriptor.');
      }
    } catch (err: any) {
      const latency = Math.round(performance.now() - startTime);
      const isAbort = err?.name === 'NotAllowedError' || err?.message?.includes('cancelled');
      const log = this.addLog({
        status: isAbort ? 'USER_CANCELLED' : 'FAILED',
        method: 'WEBAUTHN_GATE_PROBE',
        operatorIdentifier: 'wwwnishant.com0@gmail.com (Operator Nishant)',
        authenticatorType: 'Platform Authenticator (WebAuthn Gate)',
        userVerification: 'failed',
        failureReason: err?.message || 'Biometric hardware challenge failed.',
        origin,
        rpId,
        latencyMs: latency,
        securityTier: 'LEVEL 5 - WEBAUTHN HARDWARE INTERRUPT',
      });
      return log;
    }
  }
}
