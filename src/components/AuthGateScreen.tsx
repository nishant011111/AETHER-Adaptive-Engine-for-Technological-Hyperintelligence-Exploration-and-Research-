import React, { useState, useEffect } from 'react';
import {
  Shield,
  Fingerprint,
  Lock,
  Unlock,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Cpu,
  KeyRound,
  Sparkles,
  Zap,
  Terminal,
  UserCheck,
} from 'lucide-react';
import { AuthenticatedOperator } from '../types';
import {
  googleSignIn,
  authenticateBiometric,
  authenticateOperatorOverride,
} from '../lib/firebase';
import { playSound } from '../utils/audio';

interface AuthGateScreenProps {
  onAuthenticated: (operator: AuthenticatedOperator) => void;
  soundEffects: boolean;
}

export const AuthGateScreen: React.FC<AuthGateScreenProps> = ({
  onAuthenticated,
  soundEffects,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [activeMethod, setActiveMethod] = useState<'BIOMETRIC' | 'GOOGLE' | 'OVERRIDE' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [securityLogs, setSecurityLogs] = useState<string[]>([
    'A.E.T.H.E.R. Core Gateway: Cryptographic barrier active.',
    'Protocol: Firebase Authentication & WebAuthn Biometric Handshake.',
    'System: Awaiting authorized operator identity confirmation...',
  ]);

  // Optical scan simulation effect when scanning is initiated
  useEffect(() => {
    let timer: any;
    if (isScanning) {
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 70);
      return () => clearInterval(interval);
    } else {
      setScanProgress(0);
    }
  }, [isScanning]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSecurityLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 5)]);
  };

  // Biometric / WebAuthn Authentication Handler
  const handleBiometricAuth = async () => {
    if (soundEffects) playSound('boot');
    setIsScanning(true);
    setActiveMethod('BIOMETRIC');
    setAuthError(null);
    setAuthSuccess(null);
    addLog('Initiating WebAuthn platform authenticator query...');

    try {
      addLog('Verifying hardware security enclave & biometric token...');
      const operator = await authenticateBiometric();
      
      // Complete visual scan
      setScanProgress(100);
      if (soundEffects) playSound('chime');
      setAuthSuccess(`Biometric clearance verified: ${operator.displayName}`);
      addLog(`Biometric signature match confirmed: ${operator.clearanceLevel}`);
      
      setTimeout(() => {
        onAuthenticated(operator);
      }, 700);
    } catch (err: any) {
      console.error('Biometric authentication failed:', err);
      if (soundEffects) playSound('error');
      setAuthError(err.message || 'Biometric sensor validation failed. Use Google Sign-in or Operator Clearance.');
      addLog('Biometric verification aborted or timed out.');
    } finally {
      setIsScanning(false);
      setActiveMethod(null);
    }
  };

  // Google Sign-In with Firebase Auth Handler
  const handleGoogleAuth = async () => {
    if (soundEffects) playSound('click');
    setIsScanning(true);
    setActiveMethod('GOOGLE');
    setAuthError(null);
    setAuthSuccess(null);
    addLog('Launching Firebase Google OAuth 2.0 handshake...');

    try {
      const result = await googleSignIn();
      if (result) {
        if (soundEffects) playSound('chime');
        setAuthSuccess(`Google Workspace verified: ${result.user.email}`);
        addLog(`OAuth token granted. Operator: ${result.user.displayName || result.user.email}`);
        setTimeout(() => {
          onAuthenticated(result.user);
        }, 700);
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (soundEffects) playSound('error');
      setAuthError(err.message || 'Google Authentication failed. Check browser popup settings.');
      addLog('Google OAuth handshake returned an error.');
    } finally {
      setIsScanning(false);
      setActiveMethod(null);
    }
  };

  // Operator Emergency Clearance Bypass
  const handleOperatorOverride = () => {
    if (soundEffects) playSound('chime');
    setIsScanning(true);
    setActiveMethod('OVERRIDE');
    setAuthError(null);
    addLog('Activating Master Operator Clearance override protocol...');

    const operator = authenticateOperatorOverride();
    setAuthSuccess(`Primary Operator Access Granted: ${operator.displayName}`);
    
    setTimeout(() => {
      onAuthenticated(operator);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#040407] flex flex-col items-center justify-center p-4 sm:p-6 text-center font-mono select-none overflow-hidden">
      {/* Background Holographic Grid & Radial Core Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle at 50% 50%, #00f2ff18 0%, #7000ff15 40%, transparent 80%)' }}
      />
      <div className="absolute inset-0 bg-holo-grid opacity-25 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] bg-scanlines-immersive pointer-events-none" />

      {/* Central Holographic Security Card */}
      <div className="relative z-10 max-w-md w-full p-6 sm:p-8 rounded-3xl border border-[#00f2ff44] bg-[#070913ee] backdrop-blur-2xl shadow-[0_0_80px_rgba(0,242,255,0.15)] space-y-6">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-3 text-left">
          <div className="flex items-center gap-2 text-[#00f2ff]">
            <Shield className="w-5 h-5 animate-pulse" />
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase">
                A.E.T.H.E.R. Security Core
              </div>
              <div className="text-[9px] text-gray-400 font-mono">
                FIREBASE GATEWAY & BIOMETRICS
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00f2ff15] border border-[#00f2ff44] text-[9px] text-[#00f2ff] font-bold">
            <Lock className="w-3 h-3" />
            <span>LOCKED</span>
          </div>
        </div>

        {/* Biometric Optical Hologram Scanner */}
        <div className="relative flex flex-col items-center justify-center py-4">
          <div
            onClick={!isScanning ? handleBiometricAuth : undefined}
            className={`relative w-28 h-28 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 group ${
              isScanning
                ? 'border-[#00f2ff] bg-[#00f2ff22] shadow-[0_0_40px_rgba(0,242,255,0.6)] scale-105'
                : 'border-[#00f2ff55] hover:border-[#00f2ff] bg-[#00f2ff0a] hover:bg-[#00f2ff18] shadow-[0_0_25px_rgba(0,242,255,0.2)]'
            }`}
            title="Click to Scan Biometrics (TouchID / FaceID / Passkey)"
          >
            {/* Outer Pulsing Rings */}
            <div className="absolute inset-0 rounded-full border border-[#00f2ff33] animate-ping opacity-25" />
            <div className="absolute -inset-2 rounded-full border border-dashed border-[#00f2ff22] animate-spin" style={{ animationDuration: '12s' }} />

            {/* Laser Sweep Line */}
            {isScanning && (
              <div
                className="absolute left-0 right-0 h-1 bg-[#00f2ff] shadow-[0_0_12px_#00f2ff] transition-all duration-75 z-20 pointer-events-none"
                style={{ top: `${scanProgress}%` }}
              />
            )}

            <Fingerprint
              className={`w-14 h-14 transition-colors duration-200 ${
                isScanning
                  ? 'text-white animate-pulse'
                  : 'text-[#00f2ff] group-hover:text-white group-hover:scale-110'
              }`}
            />
          </div>

          <div className="mt-3 text-center">
            <div className="text-xs font-bold text-gray-200 tracking-wider flex items-center justify-center gap-1.5">
              <span>{isScanning ? `SCANNING BIOMETRICS (${scanProgress}%)` : 'BIOMETRIC TOUCH / FACE ID'}</span>
              {isScanning && <RefreshCw className="w-3 h-3 animate-spin text-[#00f2ff]" />}
            </div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
              Touch scanner or use options below to authenticate
            </div>
          </div>
        </div>

        {/* Notifications & Status Alerts */}
        {authSuccess && (
          <div className="p-3 rounded-xl bg-[#10b98122] border border-[#10b98166] text-[#10b981] text-xs font-mono flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{authSuccess}</span>
          </div>
        )}

        {authError && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div>
              <div className="font-bold">Authentication Refused</div>
              <div>{authError}</div>
            </div>
          </div>
        )}

        {/* Authentication Action Buttons */}
        <div className="space-y-2.5">
          {/* Biometric Button */}
          <button
            onClick={handleBiometricAuth}
            disabled={isScanning}
            className="w-full py-3 px-4 rounded-xl bg-[#00f2ff18] hover:bg-[#00f2ff2e] border border-[#00f2ff66] text-[#00f2ff] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-[0_0_15px_rgba(0,242,255,0.15)] hover:shadow-[0_0_25px_rgba(0,242,255,0.3)] disabled:opacity-40 cursor-pointer"
          >
            <Fingerprint className="w-4 h-4" />
            <span>Authenticate via Biometric Passkey</span>
          </button>

          {/* Official Google Sign-in Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={isScanning}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-medium text-xs tracking-wide transition-all flex items-center justify-center gap-3 shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span>Sign in with Google Account</span>
          </button>
        </div>

        {/* Operator Quick Pass / Bypass */}
        <div className="pt-2 border-t border-[#00f2ff15] flex items-center justify-between text-[10px] font-mono text-gray-400">
          <span className="truncate">Operator: Nishant</span>
          <button
            onClick={handleOperatorOverride}
            disabled={isScanning}
            className="text-[#00f2ff] hover:text-white underline cursor-pointer flex items-center gap-1 font-bold"
          >
            <KeyRound className="w-3 h-3" />
            <span>Master Clearance Pass</span>
          </button>
        </div>

        {/* Live Terminal Telemetry Log Box */}
        <div className="rounded-xl bg-[#03050a] border border-[#00f2ff1f] p-3 text-left font-mono text-[10px] text-gray-400 space-y-1 h-20 overflow-hidden">
          <div className="flex items-center gap-1 text-[#00f2ff] font-bold mb-1">
            <Terminal className="w-3 h-3" />
            <span>SECURITY HANDSHAKE LOG:</span>
          </div>
          {securityLogs.map((log, idx) => (
            <div key={idx} className="truncate text-slate-400">
              <span className="text-[#00f2ff] mr-1">›</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
